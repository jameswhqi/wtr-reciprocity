port module Main exposing (main)

-- IMPORTS --

import Array as A
import Basics.Extra exposing (..)
import Browser as B
import Browser.Dom as BD
import Browser.Events as BE
import Browser.Navigation as BN
import Color as C
import Colors exposing (..)
import Css
import Css.ModernNormalize as CM
import Dict as DI
import Html as H
import Html.Events as HE
import Json.Decode as D
import Json.Decode.Pipeline as DP
import Json.Encode as E
import List as L
import List.Extra as LE
import Maybe as M
import Process as P
import Random as RA
import Round as RO
import State
import String as ST
import String.Extra as SE
import Svg.Styled as S
import Svg.Styled.Attributes as SA
import SvgHelper exposing (..)
import Task as T
import Time
import Url as U
import Utils exposing (..)



-- TYPES --
-- ptt: participant
-- cpr: computer
-- slf: self
-- opp: opponent
-- ttrl: tutorial


type GameStage
    = PreAct
    | Act
    | PostAct
    | ShowCpr
    | Collect
    | PostCollect
    | Review
    | Memory


type Player
    = Ptt
    | Cpr


type OppReceiver
    = Opp
    | Slf
    | Discard


type alias Flags =
    ()


type Model
    = Ttrl TtrlModel
    | Test TestModel


type alias TtrlModel =
    { game : GameModel
    , step : Int
    , latestStep : Int
    , instrLength : Maybe Float
    , readyForNext : Bool
    , gameStates : A.Array GameModel
    }


type alias TestModel =
    { game : GameModel
    , round : Int
    , showTtrl : Bool
    , ttrl : TtrlModel
    }


type alias GameModel =
    { stage : GameStage
    , lambda : Maybe Float
    , fixedLambda : Maybe Float
    , prediction : Maybe Float
    , cprActed : Bool
    , pttTotal : Float
    , mouseStatus : MouseStatus
    , board : BBox
    , textLengths : TextLengths
    , animationStartTime : Maybe Int
    , slfAnimationState : AnimationState
    , oppAnimationState : AnimationState
    , loadingStep : Int
    }


type alias GameProps =
    { isTtrl : Bool
    , player : Player
    , boardConfig : BoardConfig
    , oppReceiver : OppReceiver
    , show : Show GameUnit
    , memory : Bool
    }


type alias Point =
    { x : Float, y : Float }


type alias BBox =
    { x : Float, y : Float, width : Float, height : Float }


type alias TextLengths =
    DI.Dict String Float


type Msg
    = NoOp
    | SaveState
    | LoadState
    | StateLoaded (Result D.Error Model)
    | GotTextLengths (Result D.Error TextLengths)
    | PrevStep
    | NextStep
    | TtrlProceed
    | MouseEnter
    | MouseLeave
    | MouseDown Point
    | MouseUp Point
    | MouseMove Point
    | WindowResize
    | GotBoard (Result BD.Error BD.Element)
    | GoTo GameStage
    | Animate Int
    | LoadingStep
    | CprAct
    | NormalGameMsg Msg
    | TestTtrlGameMsg Msg


type MouseStatus
    = UpOut
    | UpIn
    | DownOut
    | DownIn


type alias AnimationState =
    Maybe { x : Float, y : Float, v : Float }


type alias BoardConfig =
    -- (x - vx) / scale = -((y - vy) / scale)^2
    { location : SliderLocation
    , vx : Float
    , vy : Float
    , scale : Float
    }


type SliderLocation
    = FullBoard
    | Quadrant { xHalf : Half, yHalf : Half }


type Half
    = Lower
    | Upper


type alias CTransform =
    Float -> Float


type alias CTransforms =
    { x : CTransform
    , y : CTransform
    }


type alias TtrlStep =
    { gameShow : Show GameUnit
    , player : Player
    , oppReceiver : OppReceiver
    , instr : Instr
    , proceed : ProceedConfig
    , gameMsg : Maybe Msg
    , cmd : Maybe (Cmd Msg)
    }


type Show a
    = ShowAll
    | ShowSome (List a)


type GameUnit
    = GUBoard
    | GUPttIcon
    | GUCprIcon
    | GUPttTotal
    | GUCprTotal
    | GUSlfPay
    | GUOppPay
    | GUSlider
    | GUConfirmButton
    | GUCprStatus
    | GUOthers


type Instr
    = StaticInstr
        { x : Float
        , y : Float
        , text : String
        , anchor : Anchor
        , dim : Bool
        }
    | Callout CalloutConfig


type alias CalloutConfig =
    { target : String
    , sep : Float
    , text : String
    , targetAnchor : Anchor
    , instrAnchor : Anchor
    }


type ProceedConfig
    = ProceedAfterWait Float
    | ProceedOnMsg (Msg -> TtrlModel -> Bool)



-- PORTS --


port getTextLengths : List String -> Cmd msg


port gotTextLengths : (D.Value -> msg) -> Sub msg


port saveState : E.Value -> Cmd msg


port loadState : () -> Cmd msg


port stateLoaded : (E.Value -> msg) -> Sub msg



-- MAIN --


main : Program Flags Model Msg
main =
    B.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = always NoOp
        , onUrlChange = always NoOp
        }



-- MODEL --


init : Flags -> U.Url -> BN.Key -> ( Model, Cmd Msg )
init _ _ _ =
    ( Ttrl
        { game = initGame
        , step = 1
        , latestStep = 1
        , instrLength = Nothing
        , readyForNext = True
        , gameStates = A.repeat (A.length ttrlSteps) initGame
        }
      -- , P.sleep 1000 |> T.perform (\_ -> GotTextLengths (Ok (DI.singleton messageId 100)))
    , Cmd.batch
        [ getInstrLengths 1
        , getBoard
        ]
    )



-- ( Test
--     { game = initGame
--     , showTtrl = False
--     , ttrl =
--         { game = initGame
--         , step = 1
--         , messageLength = 0
--         }
--     }
-- , Cmd.map NormalGameMsg <| Cmd.batch [ getBoard, P.sleep 2000 |> T.perform (\_ -> CprAct) ]
-- )


initGame : GameModel
initGame =
    { stage = PreAct
    , lambda = Nothing
    , fixedLambda = Nothing
    , prediction = Nothing
    , cprActed = False
    , pttTotal = 0
    , mouseStatus = UpOut
    , board = { x = 0, y = 0, width = 0, height = 0 }
    , textLengths = DI.empty
    , animationStartTime = Nothing
    , slfAnimationState = Nothing
    , oppAnimationState = Nothing
    , loadingStep = 0
    }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        StateLoaded (Ok m) ->
            ( m, Cmd.none )

        StateLoaded (Err _) ->
            ( model, Cmd.none )

        SaveState ->
            ( model, saveState <| encodeModel model )

        LoadState ->
            ( model, loadState () )

        _ ->
            case model of
                Ttrl m ->
                    Tuple.mapFirst Ttrl <| updateTtrl False msg m

                Test m ->
                    Tuple.mapFirst Test <| updateTest msg m


updateTtrl : Bool -> Msg -> TtrlModel -> ( TtrlModel, Cmd Msg )
updateTtrl ignoreGame msg model =
    let
        ( model1, cmd1 ) =
            case msg of
                GotTextLengths (Ok ls) ->
                    let
                        maybeInstrLength =
                            L.maximum << DI.values <| DI.filter (\k _ -> ST.startsWith instrId k) ls
                    in
                    ( model |> (maybeSet setInstrLength << M.map Just <| maybeInstrLength)
                    , Cmd.none
                    )

                PrevStep ->
                    if model.step == 1 then
                        ( model, Cmd.none )

                    else
                        ( { model
                            | step = model.step - 1
                            , instrLength = Nothing
                            , game = M.withDefault initGame <| A.get (model.step - 2) model.gameStates
                          }
                        , getInstrLengths <| model.step - 1
                        )

                NextStep ->
                    if model.step == A.length ttrlSteps then
                        ( model, Cmd.none )

                    else
                        let
                            step =
                                M.withDefault defaultStep <| A.get model.step ttrlSteps

                            ( newGame, gameCmd, _ ) =
                                case step.gameMsg of
                                    Nothing ->
                                        model.game |> noCmd

                                    Just m ->
                                        updateGame m (ttrlGameProps model) model.game

                            proceed =
                                case step.proceed of
                                    ProceedAfterWait t ->
                                        if model.step == model.latestStep then
                                            P.sleep (t * 100) |> T.perform (always TtrlProceed)

                                        else
                                            P.sleep 0 |> T.perform (always TtrlProceed)

                                    _ ->
                                        Cmd.none
                        in
                        ( { model
                            | step = model.step + 1
                            , latestStep = max model.latestStep (model.step + 1)
                            , readyForNext = False
                            , instrLength = Nothing
                            , game = newGame
                            , gameStates = A.set (model.step - 1) model.game model.gameStates
                          }
                        , Cmd.batch
                            [ proceed
                            , M.withDefault Cmd.none <| step.cmd
                            , getInstrLengths <| model.step + 1
                            , gameCmd
                            ]
                        )

                TtrlProceed ->
                    ( { model | readyForNext = True }, Cmd.none )

                _ ->
                    let
                        step =
                            getStep model.step

                        model2 =
                            case step.proceed of
                                ProceedOnMsg f ->
                                    if f msg model then
                                        { model | readyForNext = True }

                                    else
                                        model

                                _ ->
                                    model
                    in
                    ( model2, Cmd.none )
    in
    if ignoreGame then
        ( model1, cmd1 )

    else
        let
            ( newGame, gameCmd, _ ) =
                updateGame msg (ttrlGameProps model1) model1.game
        in
        ( { model1 | game = newGame }, Cmd.batch [ cmd1, gameCmd ] )


updateTest : Msg -> TestModel -> ( TestModel, Cmd Msg )
updateTest msg model =
    case msg of
        NormalGameMsg m ->
            let
                ( newGame, cmd, wrap ) =
                    updateGame m (testGameProps model) model.game

                wrapper =
                    if wrap then
                        NormalGameMsg

                    else
                        identity
            in
            ( { model | game = newGame }, Cmd.map wrapper cmd )

        TestTtrlGameMsg m ->
            let
                ( newGame, cmd, wrap ) =
                    updateGame m (ttrlGameProps model.ttrl) model.ttrl.game

                wrapper =
                    if wrap then
                        TestTtrlGameMsg

                    else
                        identity
            in
            ( model |> (setTestModelTttr << setTtrlModelGame << always <| newGame), Cmd.map wrapper cmd )

        _ ->
            let
                ( newTtrl, ttrlCmd ) =
                    updateTtrl True msg model.ttrl

                ( ( newGame, gameCmd, wrap ), gameSetter ) =
                    if model.showTtrl then
                        ( updateGame msg (ttrlGameProps model.ttrl) model.ttrl.game
                        , setTestModelTttr << setTtrlModelGame << always
                        )

                    else
                        ( updateGame msg (testGameProps model) model.game
                        , setTestModelGame << always
                        )

                wrapper =
                    if wrap then
                        if model.showTtrl then
                            TestTtrlGameMsg

                        else
                            NormalGameMsg

                    else
                        identity
            in
            ( { model | ttrl = newTtrl }
                |> gameSetter newGame
            , Cmd.batch [ ttrlCmd, Cmd.map wrapper gameCmd ]
            )


updateGame : Msg -> GameProps -> GameModel -> ( GameModel, Cmd Msg, Bool )
updateGame msg p model =
    let
        localY =
            if p.player == Ptt then
                localYPtt

            else
                localYCpr

        getLambda y =
            Just << yToLambda p.boardConfig <| localY y model.board
    in
    case msg of
        GotTextLengths (Ok ls) ->
            let
                newLengths =
                    DI.union (DI.filter (\k _ -> not <| ST.startsWith instrId k) ls) model.textLengths
            in
            { model | textLengths = newLengths } |> noCmd

        MouseEnter ->
            { model
                | mouseStatus =
                    if model.mouseStatus == UpOut then
                        UpIn

                    else
                        model.mouseStatus
            }
                |> noCmd

        MouseLeave ->
            { model
                | mouseStatus =
                    if model.mouseStatus == UpIn then
                        UpOut

                    else
                        model.mouseStatus
            }
                |> noCmd

        MouseDown { x, y } ->
            if inBBox x y model.board then
                let
                    ( lambda, cmd ) =
                        if isActiveStage model.stage then
                            ( getLambda y, getBarNumberLengths p.show )

                        else
                            ( model.lambda, Cmd.none )
                in
                ( { model | mouseStatus = DownIn, lambda = lambda }, cmd, False )

            else
                { model | mouseStatus = DownOut } |> noCmd

        MouseUp { x, y } ->
            { model
                | mouseStatus =
                    if inBBox x y model.board then
                        UpIn

                    else
                        UpOut
                , lambda =
                    if model.fixedLambda == Nothing then
                        model.lambda

                    else
                        model.fixedLambda
            }
                |> noCmd

        MouseMove { y } ->
            ( { model | lambda = getLambda y }, getBarNumberLengths p.show, False )

        WindowResize ->
            ( model, getBoard, False )

        GotBoard (Ok { element }) ->
            { model | board = element } |> noCmd

        GoTo Act ->
            ( { model | stage = Act, lambda = Nothing, fixedLambda = Nothing, cprActed = False, prediction = Nothing }
            , if p.isTtrl then
                Cmd.none

              else
                P.sleep 2000 |> T.perform (\_ -> CprAct)
            , True
            )

        GoTo PostAct ->
            let
                newModel =
                    case p.player of
                        Ptt ->
                            { model | stage = PostAct, fixedLambda = model.lambda }

                        Cpr ->
                            { model | stage = PostAct, lambda = Nothing, prediction = model.lambda }

                cmd =
                    if model.cprActed && not p.isTtrl then
                        let
                            newStage =
                                if p.player == Ptt then
                                    Collect

                                else
                                    ShowCpr
                        in
                        P.sleep 1000
                            |> T.perform (always <| GoTo newStage)

                    else
                        Cmd.none
            in
            ( newModel, cmd, True )

        GoTo Memory ->
            { model | stage = Memory, lambda = Nothing, fixedLambda = Nothing, prediction = Nothing } |> noCmd

        GoTo ShowCpr ->
            ( { model | stage = ShowCpr, lambda = Just 1, fixedLambda = Just 1 }
            , if p.isTtrl then
                Cmd.none

              else
                P.sleep 1000 |> T.perform (\_ -> GoTo Collect)
            , True
            )

        GoTo Collect ->
            ( { model | stage = Collect }, getBarNumberLengths p.show, False )

        GoTo stage ->
            { model | stage = stage } |> noCmd

        Animate t ->
            updateAnimate t model p |> noCmd

        LoadingStep ->
            { model | loadingStep = model.loadingStep + 1 } |> noCmd

        CprAct ->
            let
                cmd =
                    if model.stage == PostAct && not p.isTtrl then
                        let
                            newStage =
                                if p.player == Ptt then
                                    Collect

                                else
                                    ShowCpr
                        in
                        P.sleep 1000
                            |> T.perform (always <| GoTo newStage)

                    else
                        Cmd.none
            in
            ( { model | cprActed = True }, cmd, True )

        _ ->
            model |> noCmd


updateAnimate : Int -> GameModel -> GameProps -> GameModel
updateAnimate t model p =
    case model.animationStartTime of
        Just t0 ->
            case model.lambda of
                Nothing ->
                    model

                Just lambda ->
                    let
                        ( tfSlf, tfOpp ) =
                            if p.player == Ptt then
                                ( tfPtt, tfCpr )

                            else
                                ( tfCpr, tfPtt )

                        payoffs =
                            calcPayoffs p.boardConfig lambda

                        slfAnimationState =
                            let
                                slfBarNumberLength =
                                    M.withDefault 0 <| DI.get slfBarNumberId model.textLengths
                            in
                            calcAnimation
                                { startX = tfSlf.x <| payoffs.slf + dlBarNumberHSep + slfBarNumberLength / 2 / dBoardSize
                                , startY = tfSlf.y clSlfBarY
                                , endX = tfSlf.x clTotalX
                                , endY = tfSlf.y clIconY
                                , t = t - t0
                                }

                        oppAnimationState =
                            let
                                oppBarNumberLength =
                                    M.withDefault 0 <| DI.get oppBarNumberId model.textLengths
                            in
                            case p.oppReceiver of
                                Opp ->
                                    calcAnimation
                                        { startX = tfSlf.x <| clOppBarX + dlBarWidth / 2 - oppBarNumberLength / 2 / dBoardSize
                                        , startY = tfSlf.y <| payoffs.opp + dlBarNumberVSep
                                        , endX = tfOpp.x clTotalX
                                        , endY = tfOpp.y clIconY
                                        , t = t - t0
                                        }

                                Slf ->
                                    calcAnimation
                                        { startX = tfSlf.x clOppBarX
                                        , startY = tfSlf.y <| payoffs.opp + dlBarNumberVSep
                                        , endX = tfSlf.x clTotalX
                                        , endY = tfSlf.y clIconY
                                        , t = t - t0
                                        }

                                Discard ->
                                    Nothing

                        pttTotal =
                            if p.player == Ptt && model.slfAnimationState /= Nothing && slfAnimationState == Nothing then
                                model.pttTotal + (roundPayoff <| payoffs.slf * payoffScale)

                            else if (p.player == Ptt && p.oppReceiver == Slf || p.player == Cpr && p.oppReceiver == Opp) && model.oppAnimationState /= Nothing && oppAnimationState == Nothing then
                                model.pttTotal + (roundPayoff <| payoffs.opp * payoffScale)

                            else
                                model.pttTotal

                        ( stage, animationStartTime ) =
                            if slfAnimationState == Nothing && oppAnimationState == Nothing then
                                ( if p.isTtrl then
                                    PostCollect

                                  else
                                    Review
                                , Nothing
                                )

                            else
                                ( model.stage, model.animationStartTime )
                    in
                    { model
                        | slfAnimationState = slfAnimationState
                        , oppAnimationState = oppAnimationState
                        , pttTotal = pttTotal
                        , stage = stage
                        , animationStartTime = animationStartTime
                    }

        Nothing ->
            { model | animationStartTime = Just t }


noCmd : a -> ( a, Cmd msg, Bool )
noCmd a =
    ( a, Cmd.none, False )



-- VIEW --


view : Model -> B.Document Msg
view m =
    { title = "Experiment on games"
    , body =
        let
            elements =
                case m of
                    Ttrl t ->
                        viewTtrl t

                    Test t ->
                        if t.showTtrl then
                            viewTtrl t.ttrl

                        else
                            L.append (viewGame (testGameProps t) t.game) <|
                                viewRoundCounter { round = t.round, totalRounds = nTestRounds, player = roundToPlayer t.round }
        in
        [ CM.globalHtml
        , H.div []
            [ H.button [ HE.onClick SaveState ] [ H.text "Save state" ]
            , H.button [ HE.onClick LoadState ] [ H.text "Load state" ]
            ]
        , S.toUnstyled
            << S.svg
                [ SA.width "100%"
                , SA.height <| ST.fromFloat dFullHeight
                , SA.viewBox << ST.join " " << L.map ST.fromFloat <| [ 0, 0, dFullWidth, dFullHeight ]
                , SA.pointerEvents "none"
                , SA.css
                    [ --Css.fontFamilies [ "Helvetica", "Arial", "sans-serif" ]
                      Css.fontVariantNumeric Css.tabularNums
                    , Css.property "user-select" "none"
                    , Css.property "-webkit-user-select" "none"
                    ]
                ]
            << L.concatMap (draw colorsDict)
          <|
            LE.stableSortWith (\(Element _ s1) (Element _ s2) -> compare s1.layer s2.layer) elements
        ]
    }


viewTtrl : TtrlModel -> List (Element Msg)
viewTtrl ttrl =
    let
        step =
            A.get (ttrl.step - 1) ttrlSteps

        ( prevButton, nextButton ) =
            if ttrl.readyForNext then
                ( viewButton { x = cCenterX + 140, y = tfPtt.y clIconY, w = 120, h = 50, text = "Previous", clickMsg = PrevStep, id = Just prevButtonId }
                , viewButton { x = cCenterX + 270, y = tfPtt.y clIconY, w = 120, h = 50, text = "Next", clickMsg = NextStep, id = Nothing }
                )

            else
                ( [], [] )
    in
    L.concat [ viewGame (ttrlGameProps ttrl) ttrl.game, prevButton, nextButton ]
        |> M.withDefault identity (M.map (\s -> addInstr s.instr ttrl.step ttrl.instrLength ttrl.game.textLengths) step)


addInstr : Instr -> Int -> Maybe Float -> TextLengths -> List (Element msg) -> List (Element msg)
addInstr m step instrLength textLengths =
    case m of
        StaticInstr c ->
            \l ->
                L.concat
                    [ l
                    , if c.dim then
                        [ rect { x = 0, y = 0, w = dFullWidth, h = dFullHeight }
                            |> fill (C.white |> setAlpha 0.5)
                            |> onLayer 1
                        ]

                      else
                        []
                    , buildMessage
                        { x = c.x
                        , y = c.y
                        , anchor = c.anchor
                        , text = c.text
                        , step = step
                        , instrLength = instrLength
                        }
                    ]

        Callout c ->
            addElements c.target <| addCallout c step instrLength textLengths


addCallout : CalloutConfig -> Int -> Maybe Float -> TextLengths -> Element msg -> List (Element msg)
addCallout c step instrLength textLengths (Element shape _) =
    let
        arrowLength =
            50

        target =
            let
                textLength =
                    M.withDefault 0 <| DI.get c.target textLengths
            in
            case shape of
                Text t ->
                    getTextAnchorPos t textLength c.targetAnchor

                s ->
                    getAnchorPos s c.targetAnchor

        arrowDir =
            let
                x =
                    c.instrAnchor.x - 0.5

                y =
                    c.instrAnchor.y - 0.5

                r =
                    vectorLength x y
            in
            { x = x / r, y = y / r }

        arrowEndX =
            target.x - c.sep * arrowDir.x

        arrowEndY =
            target.y - c.sep * arrowDir.y

        arrowStartX =
            arrowEndX - arrowLength * arrowDir.x

        arrowStartY =
            arrowEndY - arrowLength * arrowDir.y
    in
    (line { x1 = arrowStartX, x2 = arrowEndX, y1 = arrowStartY, y2 = arrowEndY, arrow = Just 5 }
        |> stroke C.black 3
    )
        :: buildMessage
            { x = arrowStartX
            , y = arrowStartY
            , anchor = c.instrAnchor
            , text = c.text
            , step = step
            , instrLength = instrLength
            }


buildMessage : { x : Float, y : Float, anchor : Anchor, text : String, step : Int, instrLength : Maybe Float } -> List (Element msg)
buildMessage c =
    let
        lines =
            ST.split "\n" c.text

        n =
            toFloat <| L.length lines

        fontSize =
            20

        lineSkip =
            10

        margin =
            10

        fullW =
            M.map (\l -> l + margin * 2) c.instrLength

        fullH =
            n * fontSize + (n - 1) * lineSkip + margin * 2

        centerX =
            M.map (\w -> c.x - w * (c.anchor.x - 0.5)) fullW
                |> M.withDefault c.x

        centerY =
            c.y - fullH * (c.anchor.y - 0.5)

        drawLine : Int -> String -> Element msg
        drawLine i l =
            textC l
                { x = centerX
                , y = centerY + (-(n - 1) / 2 + toFloat i) * (fontSize + lineSkip)
                , size = fontSize
                }
                |> id (buildMultilineId (buildMultilineId instrId c.step) (i + 1))
                |> onLayer 1
                |> (if c.instrLength == Nothing then
                        hide

                    else
                        identity
                   )

        bg =
            M.map
                (\w ->
                    rectC { x = centerX, y = centerY, w = w, h = fullH }
                        |> stroke C.black 3
                        |> fill C.white
                        |> onLayer 1
                )
                fullW
    in
    L.append (maybeToList bg) <| L.indexedMap drawLine lines


viewGame : GameProps -> GameModel -> List (Element Msg)
viewGame p game =
    let
        { hSlf, hOpp, tfC, tfA, tfTA } =
            getLocals p.player

        hOppPayoff =
            case p.oppReceiver of
                Opp ->
                    hOpp

                Slf ->
                    hSlf

                Discard ->
                    grays

        highlightBoard : Bool
        highlightBoard =
            isActiveStage game.stage && L.member game.mouseStatus [ UpIn, DownIn ]

        sliderStrokeWidth =
            if highlightBoard then
                4

            else
                2

        background =
            rect { x = 0, y = 0, w = dFullWidth, h = dFullHeight }
                |> fill (C.rgb255 250 250 250)
                |> onLayer -1

        predictionThumb =
            case game.prediction of
                Nothing ->
                    []

                Just lambda ->
                    let
                        payoffs =
                            calcPayoffs p.boardConfig lambda

                        cSliderX =
                            tfCpr.x payoffs.slf

                        cSliderY =
                            tfCpr.y payoffs.opp
                    in
                    [ circle { x = cSliderX, y = cSliderY, r = 7.5 }
                        |> stroke (hPtt 10) 2
                        |> fill (setAlpha 0.5 <| hPtt 17)
                    ]

        memoryLabel =
            if game.stage == Memory then
                [ textC "Memory check" { x = 150, y = 150, size = 20 } ]

            else
                []

        { slfPay, oppPay, confirmButton, othersLambda } =
            case game.lambda of
                Nothing ->
                    { slfPay = [], oppPay = [], confirmButton = [], othersLambda = [] }

                Just lambda ->
                    let
                        payoffs =
                            calcPayoffs p.boardConfig lambda

                        cSliderX =
                            tfC.x payoffs.slf

                        cSliderY =
                            tfC.y payoffs.opp

                        thumb =
                            circle { x = cSliderX, y = cSliderY, r = 7.5 }
                                |> stroke (hSlf 10) sliderStrokeWidth
                                |> fill (hSlf 17)
                                |> id thumbId

                        button =
                            case game.stage of
                                Act ->
                                    viewButton { x = cCenterX + 140, y = tfPtt.y clIconY, w = 120, h = 50, text = "Confirm", clickMsg = GoTo PostAct, id = Just confirmButtonId }

                                Review ->
                                    viewButton
                                        { x = cCenterX + 140
                                        , y = tfPtt.y clIconY
                                        , w = 140
                                        , h = 50
                                        , text = "Next round"
                                        , clickMsg =
                                            GoTo
                                                (if p.memory then
                                                    Memory

                                                 else
                                                    Act
                                                )
                                        , id = Nothing
                                        }

                                Memory ->
                                    viewButton { x = cCenterX + 140, y = tfPtt.y clIconY, w = 140, h = 50, text = "Next round", clickMsg = GoTo Act, id = Nothing }

                                _ ->
                                    []

                        slfMovingBarNumber =
                            case game.slfAnimationState of
                                Nothing ->
                                    []

                                Just { x, y, v } ->
                                    let
                                        slfBarNumberLength =
                                            M.withDefault 0 <| DI.get slfBarNumberId game.textLengths
                                    in
                                    viewMovingBarNumber { x = x, y = y, v = v, w = slfBarNumberLength, payoff = payoffs.slf, hue = hSlf }

                        oppMovingBarNumber =
                            case game.oppAnimationState of
                                Nothing ->
                                    []

                                Just { x, y, v } ->
                                    let
                                        oppBarNumberLength =
                                            M.withDefault 0 <| DI.get oppBarNumberId game.textLengths
                                    in
                                    viewMovingBarNumber { x = x, y = y, v = v, w = oppBarNumberLength, payoff = payoffs.opp, hue = hOppPayoff }
                    in
                    { slfPay =
                        [ -- slf leader
                          line { x1 = cSliderX, y1 = cSliderY, x2 = cSliderX, y2 = tfC.y <| clSlfBarY + dlBarWidth / 2, arrow = Nothing }
                            |> stroke (hSlf lLeader) dLeaderWidth
                            |> strokeDash dLeaderDash
                        , -- slf bar
                          rectA (tfA west) { x = tfC.x 0, y = tfC.y clSlfBarY, w = payoffs.slf * dBoardSize, h = dlBarWidth * dBoardSize }
                            |> fill (hSlf lBar)
                        , -- slf bar number
                          textA (formatPayoff <| payoffs.slf * payoffScale) (tfTA Start) { x = tfC.x <| payoffs.slf + dlBarNumberHSep, y = tfC.y clSlfBarY, size = fBarNumber }
                            |> id slfBarNumberId
                            |> fill (hSlf lBarNumber)
                        ]
                    , oppPay =
                        [ -- opp leader
                          line { x1 = cSliderX, y1 = cSliderY, x2 = tfC.x <| clOppBarX + dlBarWidth / 2, y2 = cSliderY, arrow = Nothing }
                            |> stroke (hOppPayoff lLeader) dLeaderWidth
                            |> strokeDash dLeaderDash
                        , -- opp bar
                          rectA (tfA south) { x = tfC.x clOppBarX, y = tfC.y 0, w = dlBarWidth * dBoardSize, h = payoffs.opp * dBoardSize }
                            |> fill (hOppPayoff lBar)
                        , -- opp bar number
                          textA (formatPayoff <| payoffs.opp * payoffScale) (tfTA End) { x = tfC.x <| clOppBarX + dlBarWidth / 2, y = tfC.y <| payoffs.opp + dlBarNumberVSep, size = fBarNumber }
                            |> id oppBarNumberId
                            |> fill (hOppPayoff lBarNumber)
                        ]
                    , confirmButton = button
                    , othersLambda =
                        L.concat
                            [ [ thumb ]
                            , slfMovingBarNumber
                            , oppMovingBarNumber
                            ]
                    }

        getElement : GameUnit -> List (Element Msg)
        getElement unit =
            case unit of
                GUBoard ->
                    [ rectC { x = cCenterX, y = cCenterY, w = dBoardSize, h = dBoardSize }
                        |> fill (hSlf 19)
                        |> id "board"
                        |> onMouseEnter MouseEnter
                        |> onMouseLeave MouseLeave
                        |> pointerEvents VisiblePainted
                    ]

                GUPttIcon ->
                    [ viewIcon { x = tfPtt.x 0.5, y = tfPtt.y clIconY, hue = hPtt }
                        |> id pttIconId
                    ]

                GUCprIcon ->
                    [ viewIcon { x = tfCpr.x 0.5, y = tfCpr.y clIconY, hue = hCpr }
                        |> id cprIconId
                    ]

                GUPttTotal ->
                    viewTotal { x = tfPtt.x clTotalX, y = tfPtt.y clIconY, hue = hPtt, text = formatPayoff game.pttTotal, id = Just pttTotalId }

                GUCprTotal ->
                    viewTotal { x = tfCpr.x clTotalX, y = tfCpr.y clIconY, hue = hCpr, text = "****", id = Nothing }

                GUSlfPay ->
                    slfPay

                GUOppPay ->
                    oppPay

                GUSlider ->
                    [ qBezier (tfParabola tfC <| calcParabola p.boardConfig)
                        |> stroke (hSlf 10) sliderStrokeWidth
                        |> id sliderId
                    ]

                GUConfirmButton ->
                    confirmButton

                GUCprStatus ->
                    let
                        x =
                            cCenterX - 80

                        y =
                            tfCpr.y clIconY
                    in
                    if game.cprActed then
                        [ complexCW check { x = x, y = y, w = 40 }
                            |> fill (hCpr 10)
                        ]

                    else
                        L.map
                            (\i ->
                                let
                                    shift =
                                        rotatePoint (45 * toFloat (game.loadingStep + i)) { x = 0, y = 20 }
                                in
                                circle { x = x + shift.x, y = y + shift.y, r = 2.5 + toFloat i * 0.25 }
                                    |> fill (hCpr <| 18 - i)
                            )
                        <|
                            L.range 0 7

                GUOthers ->
                    L.concat [ [ background ], predictionThumb, memoryLabel, othersLambda ]
    in
    filterElements p.show
        [ GUBoard
        , GUPttIcon
        , GUCprIcon
        , GUPttTotal
        , GUCprTotal
        , GUSlfPay
        , GUOppPay
        , GUSlider
        , GUConfirmButton
        , GUCprStatus
        , GUOthers
        ]
        getElement


viewIcon : { x : Float, y : Float, hue : Hue } -> Element msg
viewIcon { x, y, hue } =
    complexCW user { x = x, y = y, w = 75 } |> fill (hue 13)


viewTotal : { x : Float, y : Float, hue : Hue, text : String, id : Maybe String } -> List (Element msg)
viewTotal c =
    [ rRectC { x = c.x, y = c.y, w = 100, h = 60, r = 20 }
        |> stroke (c.hue 10) 4
        |> fill (c.hue 18)
        |> M.withDefault identity (M.map id c.id)
    , textC c.text { x = c.x, y = c.y, size = 24 } |> fill (c.hue 8)
    ]


viewButton : { x : Float, y : Float, w : Float, h : Float, text : String, clickMsg : msg, id : Maybe String } -> List (Element msg)
viewButton c =
    [ rectC { x = c.x, y = c.y, w = c.w, h = c.h }
        |> fill C.white
        |> stroke C.black 2
        |> hoverFill (grays 18)
        |> activeFill (grays 16)
        |> pointerEvents VisiblePainted
        |> onClick c.clickMsg
        |> M.withDefault identity (M.map id c.id)
    , textC c.text { x = c.x, y = c.y, size = 24 }
    ]


viewMovingBarNumber : { x : Float, y : Float, v : Float, w : Float, payoff : Float, hue : Hue } -> List (Element msg)
viewMovingBarNumber c =
    let
        scale =
            1 + c.v / 10

        r =
            5
    in
    [ rRectC { x = c.x, y = c.y, w = (c.w + r * 2) * scale, h = (fBarNumber + r * 2) * scale, r = r * scale }
        |> fill C.white
    , textC (formatPayoff <| c.payoff * payoffScale) { x = c.x, y = c.y, size = fBarNumber * scale }
        |> fill (c.hue lBarNumber)
    ]


viewRoundCounter : { round : Int, totalRounds : Int, player : Player } -> List (Element msg)
viewRoundCounter c =
    let
        x =
            150

        y =
            80

        ( roleText, roleHue ) =
            if c.player == Ptt then
                ( "Your turn", hPtt )

            else
                ( "Their turn", hCpr )

        offset =
            15
    in
    [ rRectC { x = x, y = y, w = 150, h = 80, r = 10 }
        |> fill C.white
        |> stroke (grays 5) 2
    , textC ("Round " ++ ST.fromInt c.round ++ "/" ++ ST.fromInt c.totalRounds) { x = x, y = y - offset, size = 24 }
        |> fill (grays 5)
    , textC roleText { x = x, y = y + offset, size = 24 }
        |> fill (roleHue 10)
    ]



-- SUBSCRIPTIONS --


subscriptions : Model -> Sub Msg
subscriptions m =
    let
        ( activeGame, gameProps ) =
            case m of
                Ttrl t ->
                    ( t.game, ttrlGameProps t )

                Test t ->
                    ( if t.showTtrl then
                        t.ttrl.game

                      else
                        t.game
                    , testGameProps t
                    )

        mouseDownUp =
            if isActiveStage activeGame.stage then
                Sub.batch
                    [ BE.onMouseDown (D.map2 (pointThen MouseDown) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    , BE.onMouseUp (D.map2 (pointThen MouseUp) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    ]

            else
                Sub.none

        mouseMove =
            if isActiveStage activeGame.stage && activeGame.mouseStatus == DownIn then
                BE.onMouseMove (D.map2 (pointThen MouseMove) (D.field "pageX" D.float) (D.field "pageY" D.float))

            else
                Sub.none

        windowResize =
            BE.onResize (\_ _ -> WindowResize)

        loadingStep =
            if activeGame.cprActed || activeGame.stage == PreAct || not (isShowing GUCprStatus gameProps.show) then
                Sub.none

            else
                Time.every 200 (always LoadingStep)

        wrappedSubs =
            case m of
                Ttrl t ->
                    subsToWrap t.game

                Test t ->
                    Sub.batch
                        [ Sub.map NormalGameMsg <| subsToWrap t.game
                        , Sub.map TestTtrlGameMsg <| subsToWrap t.ttrl.game
                        ]
    in
    Sub.batch
        [ stateLoaded (StateLoaded << D.decodeValue modelDecoder)
        , gotTextLengths (GotTextLengths << D.decodeValue (D.dict D.float))
        , mouseDownUp
        , mouseMove
        , windowResize
        , loadingStep
        , wrappedSubs
        ]


subsToWrap : GameModel -> Sub Msg
subsToWrap game =
    let
        animationFrame =
            if game.stage == Collect then
                BE.onAnimationFrame (Time.posixToMillis >> Animate)

            else
                Sub.none
    in
    animationFrame



-- CONSTANTS --


dFullWidth : Float
dFullWidth =
    1000


dFullHeight : Float
dFullHeight =
    680


dBoardSize : Float
dBoardSize =
    350


dlIconOffset : Float
dlIconOffset =
    100 / dBoardSize


dlTotalOffset : Float
dlTotalOffset =
    130 / dBoardSize


dlBarSep : Float
dlBarSep =
    30 / dBoardSize


dlBarWidth : Float
dlBarWidth =
    30 / dBoardSize


dLeaderWidth : Float
dLeaderWidth =
    1


dLeaderDash : List Float
dLeaderDash =
    [ 5, 5 ]


dlBarNumberHSep : Float
dlBarNumberHSep =
    5 / dBoardSize


dlBarNumberVSep : Float
dlBarNumberVSep =
    16 / dBoardSize


cCenterX : Float
cCenterX =
    dFullWidth / 2


cCenterY : Float
cCenterY =
    dFullHeight / 2


clIconY : Float
clIconY =
    -dlIconOffset


clTotalX : Float
clTotalX =
    0.5 - dlTotalOffset


cNwX : Float
cNwX =
    cCenterX - dBoardSize / 2


cNwY : Float
cNwY =
    cCenterY - dBoardSize / 2


clSlfBarY : Float
clSlfBarY =
    -dlBarSep


clOppBarX : Float
clOppBarX =
    -dlBarSep


hPtt : Hue
hPtt =
    reds


hCpr : Hue
hCpr =
    blues


colorsDict : ColorsDict
colorsDict =
    DI.fromList
        [ ( "ptt", hPtt 10 )
        , ( "cpr", hCpr 10 )
        ]


lLeader : Int
lLeader =
    10


lBar : Int
lBar =
    12


lBarNumber : Int
lBarNumber =
    8


fBarNumber : Float
fBarNumber =
    18


boardId : String
boardId =
    "board"


sliderId : String
sliderId =
    "slider"


thumbId : String
thumbId =
    "thumb"


slfBarNumberId : String
slfBarNumberId =
    "slfBarNumber"


oppBarNumberId : String
oppBarNumberId =
    "oppBarNumber"


prevButtonId : String
prevButtonId =
    "prevButton"


pttIconId : String
pttIconId =
    "pttIcon"


cprIconId : String
cprIconId =
    "cprIcon"


pttTotalId : String
pttTotalId =
    "pttTotal"


instrId : String
instrId =
    "message"


confirmButtonId : String
confirmButtonId =
    "confirmButton"


payoffScale : Float
payoffScale =
    100


nTestRounds : Int
nTestRounds =
    20


testBoardConfigs : A.Array BoardConfig
testBoardConfigs =
    generateBoardConfigs 3509 nTestRounds


defaultStep : TtrlStep
defaultStep =
    { gameShow = ShowAll
    , player = Ptt
    , oppReceiver = Opp
    , instr =
        StaticInstr
            { x = 0
            , y = 0
            , text = ""
            , anchor = { x = 0, y = 0 }
            , dim = False
            }
    , proceed = ProceedAfterWait 0
    , gameMsg = Nothing
    , cmd = Nothing
    }


ttrlSteps : A.Array TtrlStep
ttrlSteps =
    A.fromList
        [ { defaultStep
            | gameShow = ShowSome [ GUOthers ]
            , instr =
                Callout
                    { target = prevButtonId
                    , sep = 10
                    , text = dedent """
                        In this tutorial,
                        use these two buttons
                        to step forward/backward.
                        """
                    , targetAnchor = { x = 0, y = 0 }
                    , instrAnchor = { x = 1, y = 1 }
                    }
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon ]
            , instr =
                Callout
                    { target = pttIconId
                    , sep = 0
                    , text = dedent """
                        In this experiment,
                        you are the [ptt b|red] player.
                        """
                    , targetAnchor = { x = 0, y = 0 }
                    , instrAnchor = { x = 1, y = 1 }
                    }
            , proceed = ProceedAfterWait 1.5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal ]
            , instr =
                Callout
                    { target = pttTotalId
                    , sep = 10
                    , text = dedent """
                        You start with a total reward of 0
                        (in an arbitrary unit).
                        """
                    , targetAnchor = { x = 0.5, y = 0 }
                    , instrAnchor = { x = 0.5, y = 1 }
                    }
            , proceed = ProceedAfterWait 1.5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal ]
            , instr =
                Callout
                    { target = cprIconId
                    , sep = 10
                    , text = dedent """
                        You will play a multi-round game
                        with a [cpr b|blue] player (we will call it [cpr|Blue]).
                        [cpr|Blue] also starts with a total reward of 0,
                        but their total is hidden from you.
                        [cpr|Blue] will be a person randomly paired with you,
                        and they walk through exactly the same tutorial
                        as you do now.
                        """
                    , targetAnchor = { x = 0.5, y = 1 }
                    , instrAnchor = { x = 0.5, y = 0 }
                    }
            , proceed = ProceedAfterWait 5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard ]
            , instr =
                Callout
                    { target = boardId
                    , sep = 0
                    , text = dedent """
                        You and [cpr|Blue] will take turns
                        making decisions on this square board.
                        Now let's see what [ptt|your turn] looks like.
                        """
                    , targetAnchor = { x = 0.4, y = 0.6 }
                    , instrAnchor = { x = 1, y = 0 }
                    }
            , proceed = ProceedAfterWait 1.5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider ]
            , instr =
                Callout
                    { target = sliderId
                    , sep = 12
                    , text = dedent """
                        There is a [b|curve] on the board.
                        Now click somewhere on the curve.
                        """
                    , targetAnchor = { x = 0.5, y = 0 }
                    , instrAnchor = { x = 0, y = 0.5 }
                    }
            , proceed = ProceedOnMsg touched
            , gameMsg = Just <| GoTo Act
            , cmd = Just getBoard
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider ]
            , instr =
                Callout
                    { target = thumbId
                    , sep = 5
                    , text = dedent """
                        The curve is actually a slider track.
                        Now try sliding the “handle”
                        along the track.
                        """
                    , targetAnchor = { x = 1, y = 0.5 }
                    , instrAnchor = { x = 0, y = 0.5 }
                    }
            , proceed = ProceedOnMsg touched
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay ]
            , instr =
                Callout
                    { target = slfBarNumberId
                    , sep = 5
                    , text = dedent """
                        The [b|horizontal] location of the handle
                        corresponds to a [ptt b|reward for you],
                        which is proportional to
                        the length of the [ptt b|red bar].
                        Now slide the handle
                        to see how the reward changes.
                        """
                    , targetAnchor = { x = 1, y = 0 }
                    , instrAnchor = { x = 0.1, y = 1 }
                    }
            , proceed = ProceedOnMsg touched
            , cmd = Just << getBarNumberLengths <| ShowSome [ GUSlfPay ]
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUOppPay ]
            , instr =
                Callout
                    { target = oppBarNumberId
                    , sep = 5
                    , text = dedent """
                        The [b|vertical] location of the handle
                        corresponds to a [cpr b|reward for Blue],
                        which is proportional to the length of the [cpr b|blue bar].
                        Now slide the handle to see how the reward changes.
                        """
                    , targetAnchor = { x = 1, y = 0 }
                    , instrAnchor = { x = 0, y = 0.8 }
                    }
            , proceed = ProceedOnMsg touched
            , cmd = Just << getBarNumberLengths <| ShowSome [ GUOppPay ]
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                StaticInstr
                    { x = cCenterX + dBoardSize / 2 + 10
                    , y = cCenterY
                    , text = dedent """
                        Now slide the handle to see
                        how both rewards
                        change simultaneously.
                        """
                    , anchor = { x = 0, y = 0.5 }
                    , dim = False
                    }
            , proceed = ProceedOnMsg touched
            , cmd = Just << getBarNumberLengths <| ShowAll
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUConfirmButton ]
            , instr =
                Callout
                    { target = confirmButtonId
                    , sep = 5
                    , text = dedent """
                        Slide the handle to the position
                        where the [b|two rewards]
                        look the best to you.
                        After that, click the “Confirm” button.
                        """
                    , targetAnchor = { x = 1, y = 0 }
                    , instrAnchor = { x = 0.22, y = 1 }
                    }
            , proceed = ProceedOnMsg (\m _ -> m == GoTo PostAct)
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUConfirmButton ]
            , instr =
                StaticInstr
                    { x = cCenterX + dBoardSize / 2 - 10
                    , y = cCenterY
                    , text = dedent """
                        Then the two rewards will be added
                        to [ptt|your total] and [cpr|Blue’s total].
                        """
                    , anchor = { x = 0, y = 0.5 }
                    , dim = False
                    }
            , proceed =
                ProceedOnMsg
                    (\msg model ->
                        case msg of
                            Animate t ->
                                (updateAnimate t model.game (ttrlGameProps model) |> .stage) == PostCollect

                            _ ->
                                False
                    )
            , cmd = P.sleep 1000 |> T.perform (always <| GoTo Collect) |> Just
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = dFullWidth / 2
                    , y = dFullHeight / 2
                    , text = "Some text"
                    , anchor = { x = 0.5, y = 0.5 }
                    , dim = True
                    }
            , proceed = ProceedAfterWait 0
          }
        ]



-- HELPER FUNCTIONS --


maybeSet : ((a -> a) -> b -> b) -> Maybe a -> b -> b
maybeSet setter value =
    M.withDefault identity <| M.map (setter << always) value


getGame : Model -> GameModel
getGame m =
    case m of
        Ttrl t ->
            t.game

        Test t ->
            if t.showTtrl then
                t.ttrl.game

            else
                t.game


setGame : (GameModel -> GameModel) -> Model -> Model
setGame f m =
    case m of
        Ttrl t ->
            Ttrl { t | game = f t.game }

        Test t ->
            if t.showTtrl then
                Test (t |> (setTestModelTttr << setTtrlModelGame <| f))

            else
                Test { t | game = f t.game }


setInstrLength : (Maybe Float -> Maybe Float) -> TtrlModel -> TtrlModel
setInstrLength f m =
    { m | instrLength = f m.instrLength }


addElements : String -> (Element msg -> List (Element msg)) -> List (Element msg) -> List (Element msg)
addElements id f l =
    let
        me =
            LE.find (\(Element _ style) -> style.id == Just id) l
    in
    case me of
        Nothing ->
            l

        Just e ->
            l ++ f e


getInstrText : Int -> String
getInstrText i =
    M.withDefault "" << M.map stepToText <| A.get (i - 1) ttrlSteps


stepToText : TtrlStep -> String
stepToText step =
    case step.instr of
        StaticInstr { text } ->
            text

        Callout { text } ->
            text


buildMultilineId : String -> Int -> String
buildMultilineId prefix i =
    prefix ++ "-" ++ ST.fromInt i


tfPtt : CTransforms
tfPtt =
    { x = \x -> cNwX + x * dBoardSize, y = \y -> cNwY + (1 - y) * dBoardSize }


tfCpr : CTransforms
tfCpr =
    { x = \x -> cNwX + (1 - x) * dBoardSize, y = \y -> cNwY + y * dBoardSize }


calcParabola : BoardConfig -> QBezierConfig
calcParabola { location, vx, vy, scale } =
    let
        xBottom =
            vx - vy ^ 2 / scale

        ( x1, y1 ) =
            if xBottom >= 0 then
                ( xBottom, 0 )

            else
                ( 0, vy - sqrt (vx * scale) )

        xTop =
            vx - (1 - vy) ^ 2 / scale

        ( x2, y2 ) =
            if xTop >= 0 then
                ( xTop, 1 )

            else
                ( 0, vy + sqrt (vx * scale) )

        cx =
            x1 + (vy - y1) / scale * (y2 - y1)

        cy =
            (y1 + y2) / 2

        { xTf, yTf } =
            sliderLocationToTfs location
    in
    { x1 = xTf x1, y1 = yTf y1, cx = xTf cx, cy = yTf cy, x2 = xTf x2, y2 = yTf y2 }


tfParabola : CTransforms -> QBezierConfig -> QBezierConfig
tfParabola { x, y } c =
    { x1 = x c.x1, y1 = y c.y1, cx = x c.cx, cy = y c.cy, x2 = x c.x2, y2 = y c.y2 }


calcPayoffs : BoardConfig -> Float -> { slf : Float, opp : Float }
calcPayoffs { location, vx, vy, scale } lambda =
    let
        { xTf, yTf } =
            sliderLocationToTfs location
    in
    { slf = xTf << max 0 <| vx - lambda ^ 2 / 4 * scale
    , opp = yTf << max 0 <| vy + lambda / 2 * scale
    }


formatPayoff : Float -> String
formatPayoff =
    RO.round 1


roundPayoff : Float -> Float
roundPayoff =
    RO.roundNum 1


pointThen : (Point -> a) -> Float -> Float -> a
pointThen f x y =
    f <| Point x y


getBoard : Cmd Msg
getBoard =
    T.attempt GotBoard (BD.getElement boardId)


inBBox : Float -> Float -> BBox -> Bool
inBBox x y b =
    x > b.x && x < b.x + b.width && y > b.y && y < b.y + b.height


localYPtt : Float -> BBox -> Float
localYPtt y b =
    1 - (y - b.y) / b.height


localYCpr : Float -> BBox -> Float
localYCpr y b =
    (y - b.y) / b.height


yToLambda : BoardConfig -> Float -> Float
yToLambda c y =
    let
        { y1, y2 } =
            calcParabola c

        extraScale =
            case c.location of
                FullBoard ->
                    2

                Quadrant _ ->
                    4

        { yTf } =
            sliderLocationToTfs c.location
    in
    (clamp y1 y2 y - yTf c.vy) / c.scale * extraScale


defaultBoardConfig : BoardConfig
defaultBoardConfig =
    -- lambda_min = -1.5
    -- lambda_max = 2.5
    { location = FullBoard, vx = 0.78125, vy = 0.375, scale = 0.5 }


halfToTf : Half -> CTransform
halfToTf h x =
    case h of
        Lower ->
            x * 0.5

        Upper ->
            x * 0.5 + 0.5


sliderLocationToTfs : SliderLocation -> { xTf : CTransform, yTf : CTransform }
sliderLocationToTfs l =
    case l of
        FullBoard ->
            { xTf = identity, yTf = identity }

        Quadrant { xHalf, yHalf } ->
            { xTf = halfToTf xHalf, yTf = halfToTf yHalf }


randomBoardConfig : RA.Generator BoardConfig
randomBoardConfig =
    -- lambda_min \in (-2.38, -0.92)
    -- lambda_max \in (1.75, 2.97)
    let
        c =
            defaultBoardConfig

        f : Half -> Half -> Float -> Float -> Float -> BoardConfig
        f xHalf yHalf dVx dVy dScale =
            { location = Quadrant { xHalf = xHalf, yHalf = yHalf }
            , vx = c.vx + dVx
            , vy = c.vy + dVy
            , scale = c.scale + dScale
            }
    in
    RA.map5 f
        (RA.uniform Lower [ Upper ])
        (RA.uniform Lower [ Upper ])
        (RA.float -0.1 0.1)
        (RA.float -0.1 0.1)
        (RA.float -0.1 0.1)


generateBoardConfigs : Int -> Int -> A.Array BoardConfig
generateBoardConfigs seed n =
    let
        s =
            RA.initialSeed seed

        ( l, _ ) =
            State.run s <| State.traverse (State.advance << RA.step) (L.repeat n randomBoardConfig)
    in
    A.fromList l


calcAnimation : { startX : Float, startY : Float, endX : Float, endY : Float, t : Int } -> Maybe { x : Float, y : Float, v : Float }
calcAnimation c =
    let
        t =
            toFloat c.t / 1000 * 8

        dTotal =
            sqrt <| (c.startX - c.endX) ^ 2 + (c.startY - c.endY) ^ 2

        -- v = -at(t-b)
        -- d = ab^3/6
        b =
            (dTotal * 6) ^ (1 / 3)

        v =
            -t * (t - b)

        d =
            -t ^ 3 / 3 + b * t ^ 2 / 2
    in
    if d >= dTotal || v <= 0 then
        Nothing

    else
        Just
            { x = c.startX + (c.endX - c.startX) * d / dTotal
            , y = c.startY + (c.endY - c.startY) * d / dTotal
            , v = v
            }


isActiveStage : GameStage -> Bool
isActiveStage s =
    L.member s [ Act, Review, Memory ]


getLocals : Player -> { hSlf : Hue, hOpp : Hue, tfC : CTransforms, tfA : Anchor -> Anchor, tfTA : TextAnchor -> TextAnchor }
getLocals p =
    if p == Ptt then
        { hSlf = hPtt, hOpp = hCpr, tfC = tfPtt, tfA = identity, tfTA = identity }

    else
        { hSlf = hCpr, hOpp = hPtt, tfC = tfCpr, tfA = oppositeAnchor, tfTA = oppositeTextAnchor }


rotatePoint : Float -> Point -> Point
rotatePoint deg { x, y } =
    let
        rad =
            degrees deg
    in
    { x = x * cos rad - y * sin rad, y = x * sin rad + y * cos rad }


roundToOppReceiver : Int -> OppReceiver
roundToOppReceiver r =
    if L.member r [ 2, 3 ] then
        Slf

    else if L.member r [ 4, 5 ] then
        Discard

    else
        Opp


memoryRound : Int -> Bool
memoryRound r =
    L.member r [ 2, 3 ]


filterElements : Show unit -> List unit -> (unit -> List (Element msg)) -> List (Element msg)
filterElements show units f =
    case show of
        ShowAll ->
            L.concatMap f units

        ShowSome l ->
            L.concatMap f <| L.filter (flip L.member l) units


getInstrLengths : Int -> Cmd msg
getInstrLengths i =
    getTextLengths << L.map (buildMultilineId (buildMultilineId instrId i)) << L.range 1 << L.length << ST.split "\n" <| getInstrText i


getBarNumberLengths : Show GameUnit -> Cmd msg
getBarNumberLengths show =
    case show of
        ShowAll ->
            getTextLengths [ slfBarNumberId, oppBarNumberId ]

        ShowSome s ->
            let
                slf =
                    L.member GUSlfPay s

                opp =
                    L.member GUOppPay s
            in
            case ( slf, opp ) of
                ( True, True ) ->
                    getTextLengths [ slfBarNumberId, oppBarNumberId ]

                ( True, False ) ->
                    getTextLengths [ slfBarNumberId ]

                ( False, True ) ->
                    getTextLengths [ oppBarNumberId ]

                _ ->
                    Cmd.none


setTestModelGame : (GameModel -> GameModel) -> TestModel -> TestModel
setTestModelGame f m =
    { m | game = f m.game }


setTestModelTttr : (TtrlModel -> TtrlModel) -> TestModel -> TestModel
setTestModelTttr f m =
    { m | ttrl = f m.ttrl }


setTtrlModelGame : (GameModel -> GameModel) -> TtrlModel -> TtrlModel
setTtrlModelGame f m =
    { m | game = f m.game }


dedent : String -> String
dedent =
    SE.unindent >> ST.trim


ttrlGameProps : TtrlModel -> GameProps
ttrlGameProps m =
    let
        step =
            A.get (m.step - 1) ttrlSteps
    in
    { isTtrl = True
    , player = M.withDefault Ptt <| M.map .player step
    , boardConfig = defaultBoardConfig
    , oppReceiver = Opp
    , show = M.withDefault ShowAll <| M.map .gameShow step
    , memory = False
    }


testGameProps : TestModel -> GameProps
testGameProps m =
    { isTtrl = False
    , player = roundToPlayer m.round
    , boardConfig = M.withDefault defaultBoardConfig <| A.get (m.round - 1) testBoardConfigs
    , oppReceiver = Opp
    , show = ShowAll
    , memory = memoryRound m.round
    }


roundToPlayer : Int -> Player
roundToPlayer i =
    if modBy 2 i == 1 then
        Ptt

    else
        Cpr


touched : Msg -> TtrlModel -> Bool
touched msg model =
    case msg of
        MouseUp _ ->
            model.game.mouseStatus == DownIn

        _ ->
            False


getStep : Int -> TtrlStep
getStep i =
    M.withDefault defaultStep <| A.get (i - 1) ttrlSteps


isShowing : GameUnit -> Show GameUnit -> Bool
isShowing u s =
    case s of
        ShowAll ->
            True

        ShowSome l ->
            L.member u l



-- JSON --


encodeModel : Model -> E.Value
encodeModel m =
    case m of
        Ttrl t ->
            E.object
                [ ( "kind", E.string "Ttrl" )
                , ( "state", encodeTtrl t )
                ]

        Test t ->
            E.object
                [ ( "kind", E.string "Test" )
                , ( "state", encodeTest t )
                ]


modelDecoder : D.Decoder Model
modelDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "Ttrl" ->
                        D.map Ttrl <| D.field "state" ttrlDecoder

                    "Test" ->
                        D.map Test <| D.field "state" testDecoder

                    _ ->
                        D.fail <| "Unknown kind: " ++ k
            )


encodeTtrl : TtrlModel -> E.Value
encodeTtrl t =
    E.object
        [ ( "game", encodeGame t.game )
        , ( "step", E.int t.step )
        , ( "latestStep", E.int t.latestStep )
        , ( "instrLength", encodeMFloat t.instrLength )
        , ( "readyForNext", E.bool t.readyForNext )
        , ( "gameStates", E.array encodeGame t.gameStates )
        ]


ttrlDecoder : D.Decoder TtrlModel
ttrlDecoder =
    D.succeed (\g s l m r gs -> { game = g, step = s, latestStep = l, instrLength = m, readyForNext = r, gameStates = gs })
        |> DP.required "game" gameDecoder
        |> DP.required "step" D.int
        |> DP.required "latestStep" D.int
        |> DP.required "instrLength" mFloatDecoder
        |> DP.required "readyForNext" D.bool
        |> DP.required "gameStates" (D.array gameDecoder)


encodeTest : TestModel -> E.Value
encodeTest t =
    E.object
        [ ( "game", encodeGame t.game )
        , ( "round", E.int t.round )
        , ( "showTtrl", E.bool t.showTtrl )
        , ( "ttrl", encodeTtrl t.ttrl )
        ]


testDecoder : D.Decoder TestModel
testDecoder =
    D.succeed
        (\g r s t ->
            { game = g
            , round = r
            , showTtrl = s
            , ttrl = t
            }
        )
        |> DP.required "game" gameDecoder
        |> DP.required "round" D.int
        |> DP.required "showTtrl" D.bool
        |> DP.required "ttrl" ttrlDecoder


encodeGame : GameModel -> E.Value
encodeGame g =
    E.object
        [ ( "stage", encodeStage g.stage )
        , ( "lambda", encodeMFloat g.lambda )
        , ( "fixedLambda", encodeMFloat g.fixedLambda )
        , ( "prediction", encodeMFloat g.prediction )
        , ( "cprActed", E.bool g.cprActed )
        , ( "pttTotal", E.float g.pttTotal )
        , ( "mouseStatus", encodeMouseStatus g.mouseStatus )
        , ( "board", encodeBBox g.board )
        , ( "textLengths", E.dict identity E.float g.textLengths )
        , ( "animationStartTime", encodeMInt g.animationStartTime )
        , ( "slfAnimationState", encodeAnimationState g.slfAnimationState )
        , ( "oppAnimationState", encodeAnimationState g.oppAnimationState )
        , ( "loadingStep", E.int g.loadingStep )
        ]


gameDecoder : D.Decoder GameModel
gameDecoder =
    D.succeed
        (\s l fl p c pt m b t a sa oa ls ->
            { stage = s
            , lambda = l
            , fixedLambda = fl
            , prediction = p
            , cprActed = c
            , pttTotal = pt
            , mouseStatus = m
            , board = b
            , textLengths = t
            , animationStartTime = a
            , slfAnimationState = sa
            , oppAnimationState = oa
            , loadingStep = ls
            }
        )
        |> DP.required "stage" stageDecoder
        |> DP.required "lambda" mFloatDecoder
        |> DP.required "fixedLambda" mFloatDecoder
        |> DP.required "prediction" mFloatDecoder
        |> DP.required "cprActed" D.bool
        |> DP.required "pttTotal" D.float
        |> DP.required "mouseStatus" mouseStatusDecoder
        |> DP.required "board" bBoxDecoder
        |> DP.required "textLengths" (D.dict D.float)
        |> DP.required "animationStartTime" mIntDecoder
        |> DP.required "slfAnimationState" animationStateDecoder
        |> DP.required "oppAnimationState" animationStateDecoder
        |> DP.required "loadingStep" D.int


encodeStage : GameStage -> E.Value
encodeStage s =
    let
        string =
            case s of
                PreAct ->
                    "PreAct"

                Act ->
                    "Act"

                PostAct ->
                    "PostAct"

                ShowCpr ->
                    "ShowCpr"

                Collect ->
                    "Collect"

                PostCollect ->
                    "PostCollect"

                Review ->
                    "Review"

                Memory ->
                    "Memory"
    in
    E.string string


stringToStage : String -> D.Decoder GameStage
stringToStage s =
    case s of
        "PreAct" ->
            D.succeed PreAct

        "Act" ->
            D.succeed Act

        "PostAct" ->
            D.succeed PostAct

        "ShowCpr" ->
            D.succeed ShowCpr

        "Collect" ->
            D.succeed Collect

        "PostCollect" ->
            D.succeed PostCollect

        "Review" ->
            D.succeed Review

        "Memory" ->
            D.succeed Memory

        _ ->
            D.fail <| "Unknown stage: " ++ s


stageDecoder : D.Decoder GameStage
stageDecoder =
    D.string |> D.andThen stringToStage


encodeMFloat : Maybe Float -> E.Value
encodeMFloat mf =
    case mf of
        Nothing ->
            E.null

        Just f ->
            E.float f


mFloatDecoder : D.Decoder (Maybe Float)
mFloatDecoder =
    D.nullable D.float


encodeMInt : Maybe Int -> E.Value
encodeMInt mf =
    case mf of
        Nothing ->
            E.null

        Just f ->
            E.int f


mIntDecoder : D.Decoder (Maybe Int)
mIntDecoder =
    D.nullable D.int



-- encodeHalf : Half -> E.Value
-- encodeHalf h =
--     case h of
--         Lower ->
--             E.string "Lower"
--         Upper ->
--             E.string "Upper"
-- encodeSliderLocation : SliderLocation -> E.Value
-- encodeSliderLocation l =
--     case l of
--         FullBoard ->
--             E.object [ ( "kind", E.string "FullBoard" ) ]
--         Quadrant { xHalf, yHalf } ->
--             E.object
--                 [ ( "kind", E.string "Quadrant" )
--                 , ( "xHalf", encodeHalf xHalf )
--                 , ( "yHalf", encodeHalf yHalf )
--                 ]
-- encodeBoardConfig : BoardConfig -> E.Value
-- encodeBoardConfig b =
--     E.object
--         [ ( "location", encodeSliderLocation b.location )
--         , ( "vx", E.float b.vx )
--         , ( "vy", E.float b.vy )
--         , ( "scale", E.float b.scale )
--         ]
-- stringToHalf : String -> D.Decoder Half
-- stringToHalf s =
--     case s of
--         "Lower" ->
--             D.succeed Lower
--         "Upper" ->
--             D.succeed Upper
--         _ ->
--             D.fail <| "Unknown Half: " ++ s
-- halfDecoder : D.Decoder Half
-- halfDecoder =
--     D.string |> D.andThen stringToHalf
-- boardConfigDecoder : D.Decoder BoardConfig
-- boardConfigDecoder =
--     D.map5 (\xHalf yHalf vx vy scale -> { xHalf = xHalf, yHalf = yHalf, vx = vx, vy = vy, scale = scale })
--         (D.field "xHalf" halfDecoder)
--         (D.field "yHalf" halfDecoder)
--         (D.field "vx" D.float)
--         (D.field "vy" D.float)
--         (D.field "scale" D.float)


encodeMouseStatus : MouseStatus -> E.Value
encodeMouseStatus m =
    let
        string =
            case m of
                UpOut ->
                    "UpOut"

                UpIn ->
                    "UpIn"

                DownOut ->
                    "DownOut"

                DownIn ->
                    "DownIn"
    in
    E.string string


stringToMouseStatus : String -> D.Decoder MouseStatus
stringToMouseStatus s =
    case s of
        "UpOut" ->
            D.succeed UpOut

        "UpIn" ->
            D.succeed UpIn

        "DownOut" ->
            D.succeed DownOut

        "DownIn" ->
            D.succeed DownIn

        _ ->
            D.fail <| "Unknown mouse status: " ++ s


mouseStatusDecoder : D.Decoder MouseStatus
mouseStatusDecoder =
    D.string
        |> D.andThen stringToMouseStatus


encodeBBox : BBox -> E.Value
encodeBBox b =
    E.object <|
        L.map (Tuple.mapSecond E.float)
            [ ( "x", b.x )
            , ( "y", b.y )
            , ( "width", b.width )
            , ( "height", b.height )
            ]


bBoxDecoder : D.Decoder BBox
bBoxDecoder =
    D.map4 (\x y width height -> { x = x, y = y, width = width, height = height })
        (D.field "x" D.float)
        (D.field "y" D.float)
        (D.field "width" D.float)
        (D.field "height" D.float)


encodeAnimationState : AnimationState -> E.Value
encodeAnimationState a =
    case a of
        Nothing ->
            E.null

        Just { x, y, v } ->
            E.object <|
                L.map (Tuple.mapSecond E.float)
                    [ ( "x", x )
                    , ( "y", y )
                    , ( "v", v )
                    ]


animationStateDecoder : D.Decoder AnimationState
animationStateDecoder =
    D.nullable <|
        D.map3 (\x y v -> { x = x, y = y, v = v })
            (D.field "x" D.float)
            (D.field "y" D.float)
            (D.field "v" D.float)



-- END --
