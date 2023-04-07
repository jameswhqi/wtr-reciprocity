port module Main exposing (main)

-- IMPORTS --

import Array as A
import Basics.Extra exposing (..)
import Browser as B
import Browser.Dom as BD
import Browser.Events as BE
import Browser.Navigation as BN
import Color as CO
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
import Platform.Cmd as C
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


type ExptStage
    = ESTtrl
    | ESTest


type GameStage
    = PreAct
    | Act
    | PostAct
    | ShowCpr
    | CollectPays
    | PostCollectPays
    | ShowPredPay
    | CollectPredPay
    | PostCollectPredPay
    | Review
    | PostReview
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
    , instrLength : Maybe Float
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
    , instrLength : Maybe Float
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
    | NextStep Bool
    | TtrlProceed
    | MouseEnter
    | MouseLeave
    | MouseDown Point
    | MouseUp Point
    | MouseMove Point
    | WindowResize
    | GotBoard (Result BD.Error BD.Element)
    | NextRound
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
    -- (y - vy) / scale = -((x - vx) / scale)^2
    { location : SliderLocation
    , vy : Float
    , vx : Float
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
    case initStage of
        ESTtrl ->
            ( Ttrl initTtrl, initTtrlCmd )

        ESTest ->
            ( Test initTest, initTestCmd )


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
    , instrLength = Nothing
    , textLengths = DI.empty
    , animationStartTime = Nothing
    , slfAnimationState = Nothing
    , oppAnimationState = Nothing
    , loadingStep = 0
    }


initTtrl : TtrlModel
initTtrl =
    { game = initGame
    , step = 1
    , latestStep = 1
    , instrLength = Nothing
    , readyForNext = True
    , gameStates = A.repeat (A.length ttrlSteps) initGame
    }


initTtrlCmd : Cmd Msg
initTtrlCmd =
    C.batch
        [ getTtrlInstrLengths 1
        , getBoard
        ]


initTest : TestModel
initTest =
    { game = { initGame | stage = Act }
    , round = 1
    , instrLength = Nothing
    , showTtrl = False
    , ttrl = { initTtrl | latestStep = A.length ttrlSteps }
    }


initTestCmd : Cmd Msg
initTestCmd =
    C.batch
        [ P.sleep 2000 |> T.perform (always <| CprAct)
        , getBoard
        , getGameInstrLengths (testGameProps initTest |> .player) Act
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg m =
    let
        ( m1, c1 ) =
            case msg of
                StateLoaded (Ok m2) ->
                    ( m2, C.none )

                StateLoaded (Err _) ->
                    ( m, C.none )

                SaveState ->
                    ( m, saveState <| encodeModel m )

                LoadState ->
                    ( m, loadState () )

                NextStep _ ->
                    case m of
                        Ttrl t ->
                            if t.step == A.length ttrlSteps then
                                ( Test initTest, initTestCmd )

                            else
                                ( m, C.none )

                        _ ->
                            ( m, C.none )

                _ ->
                    ( m, C.none )

        ( m3, c3 ) =
            case m1 of
                Ttrl ttrl ->
                    Tuple.mapFirst Ttrl <| updateTtrl False msg ttrl

                Test test ->
                    Tuple.mapFirst Test <| updateTest msg test
    in
    ( m3, C.batch [ c1, c3 ] )


updateTtrl : Bool -> Msg -> TtrlModel -> ( TtrlModel, Cmd Msg )
updateTtrl ignoreGame msg m =
    let
        ( m1, c1 ) =
            case msg of
                GotTextLengths (Ok ls) ->
                    ( m |> updateInstrLength ttrlInstrId setTtrlInstrLength ls
                    , C.none
                    )

                PrevStep ->
                    if m.step == 1 then
                        ( m, C.none )

                    else
                        ( { m
                            | step = m.step - 1
                            , instrLength = Nothing
                            , game = M.withDefault initGame <| A.get (m.step - 2) m.gameStates
                          }
                        , getTtrlInstrLengths <| m.step - 1
                        )

                NextStep wait ->
                    let
                        nextStep =
                            getStep <| m.step + 1

                        updateGameWithMsg msg1 =
                            updateGame identity msg1 (ttrlGameProps m) (ttrlGameProps m) m.game

                        ( game1, gameCmd1 ) =
                            nextStep.gameMsg
                                |> M.map updateGameWithMsg
                                |> M.withDefault ( m.game, C.none )

                        ( readyForNext, proceedCmd ) =
                            case nextStep.proceed of
                                ProceedAfterWait t ->
                                    if m.step == m.latestStep && wait then
                                        ( False
                                        , P.sleep (t * 1000 / ttrlWaitSpeedRatio)
                                            |> T.perform (always TtrlProceed)
                                        )

                                    else
                                        ( True, C.none )

                                ProceedOnMsg _ ->
                                    ( False, C.none )
                    in
                    if m.step == A.length ttrlSteps || not m.readyForNext then
                        ( m, C.none )

                    else
                        ( { m
                            | step = m.step + 1
                            , latestStep = max m.latestStep (m.step + 1)
                            , readyForNext = readyForNext
                            , instrLength = Nothing
                            , game = game1
                            , gameStates = A.set (m.step - 1) m.game m.gameStates
                          }
                        , C.batch
                            [ proceedCmd
                            , M.withDefault C.none <| nextStep.cmd
                            , getTtrlInstrLengths <| m.step + 1
                            , gameCmd1
                            ]
                        )

                NextRound ->
                    ( m |> set (setTtrlGame << setGameStage) PostReview, C.none )

                TtrlProceed ->
                    ( { m | readyForNext = True }, C.none )

                _ ->
                    ( m, C.none )

        currentStep =
            getStep m.step

        m2 =
            case currentStep.proceed of
                ProceedOnMsg f ->
                    if f msg m then
                        { m1 | readyForNext = True }

                    else
                        m1

                _ ->
                    m1

        ( game2, gameCmd2 ) =
            updateGame identity msg (ttrlGameProps m) (ttrlGameProps m2) m2.game
    in
    if ignoreGame then
        ( m2, c1 )

    else
        ( { m2 | game = game2 }, C.batch [ c1, gameCmd2 ] )


updateTest : Msg -> TestModel -> ( TestModel, Cmd Msg )
updateTest msg m =
    let
        ( m1, c1 ) =
            case msg of
                NormalGameMsg msg1 ->
                    let
                        ( game1, gameCmd1 ) =
                            updateGame NormalGameMsg msg1 (testGameProps m) (testGameProps m) m.game
                    in
                    ( { m | game = game1 }, gameCmd1 )

                TestTtrlGameMsg msg1 ->
                    let
                        ( game1, gameCmd1 ) =
                            updateGame TestTtrlGameMsg msg1 (ttrlGameProps m.ttrl) (ttrlGameProps m.ttrl) m.ttrl.game
                    in
                    ( m |> set (setTestModelTttr << setTtrlModelGame) game1, gameCmd1 )

                NextRound ->
                    updateTest (NormalGameMsg <| GoTo Act) { m | round = m.round + 1 }

                _ ->
                    ( m, C.none )

        ( ttrl, ttrlCmd ) =
            updateTtrl True msg m1.ttrl

        ( ( game2, gameCmd2 ), gameSetter ) =
            if m1.showTtrl then
                ( updateGame TestTtrlGameMsg msg (ttrlGameProps m.ttrl) (ttrlGameProps m1.ttrl) m1.ttrl.game
                , set (setTestModelTttr << setTtrlModelGame)
                )

            else
                ( updateGame NormalGameMsg msg (testGameProps m) (testGameProps m1) m1.game
                , set setTestModelGame
                )
    in
    ( { m1 | ttrl = ttrl } |> gameSetter game2
    , C.batch [ c1, ttrlCmd, gameCmd2 ]
    )


updateGame : (Msg -> Msg) -> Msg -> GameProps -> GameProps -> GameModel -> ( GameModel, Cmd Msg )
updateGame wrapper msg op p m =
    let
        localX =
            if p.player == Ptt then
                localXPtt

            else
                localXCpr

        getLambda x =
            Just << xToLambda p.boardConfig <| localX x m.board

        ( m1, c1, wrap ) =
            case msg of
                GotTextLengths (Ok ls) ->
                    let
                        m2 =
                            m |> updateInstrLength gameInstrId setGameInstrLength ls

                        pred k _ =
                            L.all (\i -> not <| ST.startsWith i k) [ ttrlInstrId, gameInstrId ]

                        newLengths =
                            DI.union (DI.filter pred ls) m.textLengths
                    in
                    { m2 | textLengths = newLengths } |> noCmdOrWrap

                MouseEnter ->
                    let
                        mouseStatus =
                            if m.mouseStatus == UpOut then
                                UpIn

                            else
                                m.mouseStatus
                    in
                    { m | mouseStatus = mouseStatus } |> noCmdOrWrap

                MouseLeave ->
                    let
                        mouseStatus =
                            if m.mouseStatus == UpIn then
                                UpOut

                            else
                                m.mouseStatus
                    in
                    { m | mouseStatus = mouseStatus } |> noCmdOrWrap

                MouseDown { x, y } ->
                    let
                        ( lambda, c2 ) =
                            if isActiveStage m.stage then
                                ( getLambda x, getBarNumberLengths p.show )

                            else
                                ( m.lambda, C.none )
                    in
                    if inBBox x y m.board then
                        ( { m | mouseStatus = DownIn, lambda = lambda }, c2, False )

                    else
                        { m | mouseStatus = DownOut } |> noCmdOrWrap

                MouseUp { x, y } ->
                    let
                        mouseStatus =
                            if inBBox x y m.board then
                                UpIn

                            else
                                UpOut

                        lambda =
                            if m.fixedLambda == Nothing then
                                m.lambda

                            else
                                m.fixedLambda
                    in
                    { m | mouseStatus = mouseStatus, lambda = lambda } |> noCmdOrWrap

                MouseMove { x } ->
                    ( { m | lambda = getLambda x }
                    , getBarNumberLengths p.show
                    , False
                    )

                WindowResize ->
                    ( m, getBoard, False )

                GotBoard (Ok { element }) ->
                    { m | board = element } |> noCmdOrWrap

                GoTo PreAct ->
                    { m
                        | stage = PreAct
                        , lambda = Nothing
                        , fixedLambda = Nothing
                        , cprActed = False
                        , prediction = Nothing
                    }
                        |> noCmdOrWrap

                GoTo Act ->
                    let
                        c2 =
                            if p.isTtrl then
                                C.none

                            else
                                P.sleep 2000 |> T.perform (\_ -> CprAct)
                    in
                    ( { m
                        | stage = Act
                        , lambda = Nothing
                        , fixedLambda = Nothing
                        , cprActed = False
                        , prediction = Nothing
                      }
                    , c2
                    , True
                    )

                GoTo PostAct ->
                    let
                        m2 =
                            case p.player of
                                Ptt ->
                                    { m | stage = PostAct, lambda = newLambda, fixedLambda = newLambda }

                                Cpr ->
                                    { m | stage = PostAct, lambda = Nothing, prediction = newLambda }

                        newLambda =
                            Just << M.withDefault 0.5 <| m.lambda

                        c2 =
                            if m.cprActed && not p.isTtrl then
                                P.sleep 1000 |> T.perform (always <| GoTo newStage)

                            else
                                C.none

                        newStage =
                            if p.player == Ptt then
                                CollectPays

                            else
                                ShowCpr
                    in
                    ( m2, c2, True )

                GoTo Memory ->
                    { m | stage = Memory, lambda = Nothing, fixedLambda = Nothing, prediction = Nothing } |> noCmdOrWrap

                GoTo ShowCpr ->
                    ( { m | stage = ShowCpr, lambda = Just 1, fixedLambda = Just 1 }
                    , P.sleep 1000 |> T.perform (\_ -> GoTo CollectPays)
                    , True
                    )

                GoTo CollectPays ->
                    ( { m | stage = CollectPays }, getBarNumberLengths p.show, False )

                GoTo ShowPredPay ->
                    let
                        getStage pay =
                            if roundPayoff (pay * payoffScale) == 0 then
                                Review

                            else
                                CollectPredPay

                        stage =
                            M.map2 calcPredPayoff m.prediction m.fixedLambda
                                |> M.map getStage
                                |> M.withDefault Review
                    in
                    ( { m | stage = ShowPredPay }
                    , P.sleep 1000 |> T.perform (\_ -> GoTo stage)
                    , True
                    )

                GoTo CollectPredPay ->
                    ( { m | stage = CollectPredPay }, getTextLengths [ predPayId ], False )

                GoTo stage ->
                    { m | stage = stage } |> noCmdOrWrap

                Animate t ->
                    let
                        ( m2, c2 ) =
                            updateAnimate t m p
                    in
                    ( m2, c2, False )

                LoadingStep ->
                    { m | loadingStep = m.loadingStep + 1 } |> noCmdOrWrap

                CprAct ->
                    let
                        c2 =
                            if m.stage == PostAct && not p.isTtrl then
                                P.sleep 1000 |> T.perform (always <| GoTo stage)

                            else
                                C.none

                        stage =
                            if p.player == Ptt then
                                CollectPays

                            else
                                ShowCpr
                    in
                    ( { m | cprActed = True }, c2, True )

                _ ->
                    m |> noCmdOrWrap

        ( m3, c3 ) =
            if op.player /= p.player || m.stage /= m1.stage then
                ( { m1 | instrLength = Nothing }, getGameInstrLengths p.player m1.stage )

            else
                ( m1, C.none )

        wrapper2 =
            if wrap then
                wrapper

            else
                identity
    in
    ( m3, C.map wrapper2 <| C.batch [ c1, c3 ] )


updateAnimate : Int -> GameModel -> GameProps -> ( GameModel, Cmd Msg )
updateAnimate t m p =
    let
        ( tfSlf, tfOpp ) =
            if p.player == Ptt then
                ( tfPtt, tfCpr )

            else
                ( tfCpr, tfPtt )

        update1 t0 lambda =
            let
                payoffs =
                    calcPayoffs p.boardConfig lambda

                slfAnimationState =
                    getSlfAnimationState t0 payoffs

                oppAnimationState =
                    getOppAnimationState t0 payoffs

                pttTotal =
                    if p.player == Ptt && m.slfAnimationState /= Nothing && slfAnimationState == Nothing then
                        m.pttTotal + (roundPayoff <| payoffs.slf * payoffScale)

                    else if (p.player == Ptt && p.oppReceiver == Slf || p.player == Cpr && p.oppReceiver == Opp) && m.oppAnimationState /= Nothing && oppAnimationState == Nothing then
                        m.pttTotal + (roundPayoff <| payoffs.opp * payoffScale)

                    else if p.player == Cpr && m.slfAnimationState /= Nothing && slfAnimationState == Nothing then
                        m.pttTotal + (roundPayoff <| (M.withDefault 0 <| M.map2 calcPredPayoff m.fixedLambda m.prediction) * payoffScale)

                    else
                        m.pttTotal

                ( stage, animationStartTime, cmd ) =
                    if slfAnimationState == Nothing && oppAnimationState == Nothing then
                        ( if m.stage == CollectPays && (p.isTtrl || p.player == Cpr) then
                            PostCollectPays

                          else if m.stage == CollectPredPay && p.isTtrl then
                            PostCollectPredPay

                          else
                            Review
                        , Nothing
                        , if m.stage == CollectPays && not p.isTtrl && p.player == Cpr then
                            P.sleep 1000 |> T.perform (always <| GoTo ShowPredPay)

                          else
                            C.none
                        )

                    else
                        ( m.stage, m.animationStartTime, C.none )
            in
            ( { m
                | slfAnimationState = slfAnimationState
                , oppAnimationState = oppAnimationState
                , pttTotal = pttTotal
                , stage = stage
                , animationStartTime = animationStartTime
              }
            , cmd
            )

        getSlfAnimationState t0 payoffs =
            case m.stage of
                CollectPays ->
                    let
                        slfBarNumberLength =
                            M.withDefault 0 <| DI.get slfBarNumberId m.textLengths
                    in
                    calcAnimation
                        { startX = tfSlf.x <| clSlfBarX + dlBarWidth / 2 - slfBarNumberLength / 2 / dBoardSize
                        , startY = tfSlf.y <| payoffs.slf + dlBarNumberVSep
                        , endX = tfSlf.x clIconX
                        , endY = tfSlf.y clTotalY
                        , t = t - t0
                        }

                CollectPredPay ->
                    let
                        predPayoffs predLambda =
                            ( predLambda, calcPayoffs p.boardConfig predLambda )

                        getState ( pl, predPays ) =
                            calcAnimation
                                { startX = tfSlf.x <| predPays.opp + 0.02 * pl
                                , startY = tfSlf.y <| predPays.slf + dlPredPaySep
                                , endX = tfOpp.x clIconX
                                , endY = tfOpp.y clTotalY
                                , t = t - t0
                                }
                    in
                    M.map predPayoffs m.prediction
                        |> M.andThen getState

                _ ->
                    Nothing

        getOppAnimationState t0 payoffs =
            case m.stage of
                CollectPays ->
                    let
                        oppBarNumberLength =
                            M.withDefault 0 <| DI.get oppBarNumberId m.textLengths
                    in
                    case p.oppReceiver of
                        Opp ->
                            calcAnimation
                                { startX = tfSlf.x <| payoffs.opp + dlBarNumberHSep + oppBarNumberLength / 2 / dBoardSize
                                , startY = tfSlf.y clOppBarY
                                , endX = tfOpp.x clIconX
                                , endY = tfOpp.y clTotalY
                                , t = t - t0
                                }

                        Slf ->
                            calcAnimation
                                { startX = tfSlf.x <| payoffs.opp + dlBarNumberHSep + oppBarNumberLength / 2 / dBoardSize
                                , startY = tfSlf.y clOppBarY
                                , endX = tfSlf.x clIconX
                                , endY = tfSlf.y clTotalY
                                , t = t - t0
                                }

                        Discard ->
                            Nothing

                _ ->
                    Nothing
    in
    case m.animationStartTime of
        Nothing ->
            ( { m | animationStartTime = Just t }, C.none )

        Just t0 ->
            case m.lambda of
                Nothing ->
                    ( m, C.none )

                Just lambda ->
                    update1 t0 lambda


noCmdOrWrap : a -> ( a, Cmd msg, Bool )
noCmdOrWrap a =
    ( a, C.none, False )



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
                        viewTest t
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
                    [ -- Css.fontFamilies [ "Helvetica", "Arial", "sans-serif" ]
                      -- Css.fontVariantNumeric Css.tabularNums
                      Css.property "user-select" "none"
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
                ( viewButton { x = cCenterX - 70, y = cCenterY + 270, w = 120, h = 50, text = "Previous", clickMsg = PrevStep, id = Just prevButtonId }
                , viewButton
                    { x = cCenterX + 70
                    , y = cCenterY + 270
                    , w = 120
                    , h = 50
                    , text =
                        if ttrl.step == A.length ttrlSteps then
                            "Finish"

                        else
                            "Next"
                    , clickMsg = NextStep True
                    , id = Just nextButtonId
                    }
                )

            else
                ( [], [] )

        -- stepCounter =
    in
    L.concat [ viewGame (ttrlGameProps ttrl) ttrl.game, prevButton, nextButton, viewStepCounter ttrl.step ]
        |> M.withDefault identity (M.map (\s -> addInstr s.instr ttrl.instrLength ttrl.game.textLengths) step)


viewTest : TestModel -> List (Element Msg)
viewTest test =
    if test.showTtrl then
        viewTtrl test.ttrl

    else
        let
            roundCounter =
                viewRoundCounter
                    { round = test.round
                    , totalRounds = nTestRounds
                    , player = roundToPlayer test.round
                    }
        in
        L.concat [ viewGame (testGameProps test) test.game, roundCounter ]


addInstr : Instr -> Maybe Float -> TextLengths -> List (Element msg) -> List (Element msg)
addInstr m instrLength textLengths =
    case m of
        StaticInstr c ->
            \l ->
                L.concat
                    [ l
                    , if c.dim then
                        [ rect { x = 0, y = 0, w = dFullWidth, h = dFullHeight }
                            |> fill (CO.white |> setAlpha 0.5)
                            |> onLayer 1
                        ]

                      else
                        []
                    , buildMessage
                        { x = c.x
                        , y = c.y
                        , anchor = c.anchor
                        , text = c.text
                        , prefix = ttrlInstrId
                        , instrLength = instrLength
                        }
                    ]

        Callout c ->
            addElements c.target <| addCallout c instrLength textLengths


addCallout : CalloutConfig -> Maybe Float -> TextLengths -> Element msg -> List (Element msg)
addCallout c instrLength textLengths (Element shape _) =
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
        |> stroke CO.black 3
        |> onLayer 3
    )
        :: buildMessage
            { x = arrowStartX
            , y = arrowStartY
            , anchor = c.instrAnchor
            , text = c.text
            , prefix = ttrlInstrId
            , instrLength = instrLength
            }


buildMessage : { x : Float, y : Float, anchor : Anchor, text : String, prefix : String, instrLength : Maybe Float } -> List (Element msg)
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
                |> id (buildMultilineId c.prefix (i + 1))
                |> onLayer 3
                |> (if c.instrLength == Nothing then
                        hide

                    else
                        identity
                   )

        bg =
            M.map
                (\w ->
                    rectC { x = centerX, y = centerY, w = w, h = fullH }
                        |> stroke CO.black 3
                        |> fill CO.white
                        |> onLayer 3
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
                |> fill (CO.rgb255 250 250 250)
                |> onLayer -1

        pred =
            case game.prediction of
                Nothing ->
                    []

                Just lambda ->
                    let
                        payoffs =
                            calcPayoffs p.boardConfig lambda

                        cSliderX =
                            tfCpr.x payoffs.opp

                        cSliderY =
                            tfCpr.y payoffs.slf

                        predThumb =
                            circle { x = cSliderX, y = cSliderY, r = 7.5 }
                                |> stroke (hPtt 10) 2
                                |> fill (setAlpha 0.5 <| hPtt 17)
                                |> (if game.stage == PostAct then
                                        id thumbId

                                    else
                                        identity
                                   )

                        predPay =
                            M.map (calcPredPayoff lambda) game.fixedLambda

                        getPredPayText pay =
                            if p.player == Cpr && L.member game.stage [ ShowPredPay, CollectPredPay, PostCollectPredPay, Review, PostReview ] then
                                Just
                                    (textA (formatPayoff <| pay * payoffScale)
                                        TAMiddle
                                        { x = tfCpr.x <| payoffs.opp + 0.02 * lambda
                                        , y = tfCpr.y <| payoffs.slf + dlPredPaySep
                                        , size = fBarNumber
                                        }
                                        |> id predPayId
                                        |> fill (hOpp lBarNumber)
                                        |> tabularNums
                                    )

                            else
                                Nothing

                        predPayText =
                            predPay |> M.andThen getPredPayText

                        numberLength =
                            DI.get predPayId game.textLengths

                        getMovingNumber pay nl { x, y, v } =
                            viewMovingNumber { x = x, y = y, v = v, w = nl, payoff = pay, hue = hPtt }

                        movingNumber =
                            M.map3 getMovingNumber predPay numberLength game.slfAnimationState
                    in
                    L.concat [ [ predThumb ], maybeToList predPayText, maybeListToList movingNumber ]

        { slfPay, oppPay, confirmButton, othersLambda } =
            case game.lambda of
                Nothing ->
                    { slfPay = [], oppPay = [], confirmButton = [], othersLambda = [] }

                Just lambda ->
                    let
                        payoffs =
                            calcPayoffs p.boardConfig lambda

                        cSliderX =
                            tfC.x payoffs.opp

                        cSliderY =
                            tfC.y payoffs.slf

                        thumb =
                            circle { x = cSliderX, y = cSliderY, r = 7.5 }
                                |> stroke (hSlf 10) sliderStrokeWidth
                                |> fill (hSlf 17)
                                |> id thumbId

                        button =
                            case game.stage of
                                Act ->
                                    viewButton { x = tfPtt.x clIconX, y = cCenterY + 200, w = 120, h = 50, text = "Confirm", clickMsg = GoTo PostAct, id = Just confirmButtonId }

                                Review ->
                                    viewButton
                                        { x = tfPtt.x clIconX
                                        , y = cCenterY + 200
                                        , w = 140
                                        , h = 50
                                        , text = "Next round"
                                        , clickMsg =
                                            if p.memory then
                                                GoTo Memory

                                            else
                                                NextRound
                                        , id = Just confirmButtonId
                                        }

                                Memory ->
                                    viewButton { x = tfPtt.x clIconX, y = cCenterY + 200, w = 140, h = 50, text = "Next round", clickMsg = NextRound, id = Nothing }

                                _ ->
                                    []

                        slfBarNumberLength =
                            DI.get slfBarNumberId game.textLengths

                        getSlfMovingBarNumber nl { x, y, v } =
                            if game.stage == CollectPays then
                                Just <| viewMovingNumber { x = x, y = y, v = v, w = nl, payoff = payoffs.slf, hue = hSlf }

                            else
                                Nothing

                        slfMovingBarNumber =
                            M.map2 getSlfMovingBarNumber slfBarNumberLength game.slfAnimationState
                                |> M.andThen identity
                                |> maybeListToList

                        oppMovingBarNumber =
                            case game.oppAnimationState of
                                Nothing ->
                                    []

                                Just { x, y, v } ->
                                    let
                                        numberLength =
                                            M.withDefault 0 <| DI.get oppBarNumberId game.textLengths
                                    in
                                    viewMovingNumber { x = x, y = y, v = v, w = numberLength, payoff = payoffs.opp, hue = hOppPayoff }
                    in
                    { slfPay =
                        [ -- slf leader
                          line { x1 = cSliderX, y1 = cSliderY, x2 = tfC.x <| clSlfBarX + dlBarWidth / 2, y2 = cSliderY, arrow = Nothing }
                            |> stroke (hSlf lLeader) dLeaderWidth
                            |> strokeDash dLeaderDash
                        , -- slf bar
                          rectA (tfA south) { x = tfC.x clSlfBarX, y = tfC.y 0, w = dlBarWidth * dBoardSize, h = payoffs.slf * dBoardSize }
                            |> fill (hSlf lBar)
                        , -- slf bar number
                          textA (formatPayoff <| payoffs.slf * payoffScale) (tfTA End) { x = tfC.x <| clSlfBarX + dlBarWidth / 2, y = tfC.y <| payoffs.slf + dlBarNumberVSep, size = fBarNumber }
                            |> id slfBarNumberId
                            |> fill (hSlf lBarNumber)
                            |> tabularNums
                        ]
                    , oppPay =
                        [ -- opp leader
                          line { x1 = cSliderX, y1 = cSliderY, x2 = cSliderX, y2 = tfC.y <| clOppBarY + dlBarWidth / 2, arrow = Nothing }
                            |> stroke (hOppPayoff lLeader) dLeaderWidth
                            |> strokeDash dLeaderDash
                        , -- opp bar
                          rectA (tfA west) { x = tfC.x 0, y = tfC.y clOppBarY, w = payoffs.opp * dBoardSize, h = dlBarWidth * dBoardSize }
                            |> fill (hOppPayoff lBar)
                        , -- opp bar number
                          textA (formatPayoff <| payoffs.opp * payoffScale) (tfTA Start) { x = tfC.x <| payoffs.opp + dlBarNumberHSep, y = tfC.y clOppBarY, size = fBarNumber }
                            |> id oppBarNumberId
                            |> fill (hOppPayoff lBarNumber)
                            |> tabularNums
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
                    [ viewIcon { x = tfPtt.x clIconX, y = tfPtt.y 0.5, hue = hPtt }
                        |> id pttIconId
                    ]

                GUCprIcon ->
                    [ viewIcon { x = tfCpr.x clIconX, y = tfCpr.y 0.5, hue = hCpr }
                        |> id cprIconId
                    ]

                GUPttTotal ->
                    viewTotal { x = tfPtt.x clIconX, y = tfPtt.y clTotalY, hue = hPtt, text = formatPayoff game.pttTotal, id = Just pttTotalId }

                GUCprTotal ->
                    viewTotal { x = tfCpr.x clIconX, y = tfCpr.y clTotalY, hue = hCpr, text = "****", id = Nothing }

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
                            tfCpr.x clIconX + 80

                        y =
                            cCenterY

                        fg =
                            if game.cprActed then
                                [ complexCW check { x = x, y = y, w = 40 }
                                    |> fill (hCpr 10)
                                ]

                            else
                                L.map
                                    (\i ->
                                        let
                                            shift =
                                                rotatePoint (45 * toFloat (game.loadingStep + i)) <| xy 0 20
                                        in
                                        circle { x = x + shift.x, y = y + shift.y, r = 2.5 + toFloat i * 0.25 }
                                            |> fill (hCpr <| 18 - i)
                                    )
                                <|
                                    L.range 0 7

                        bg =
                            rectC { x = x, y = y, w = 50, h = 50 }
                                |> fill transparent
                                |> id cprStatusId
                    in
                    bg :: fg

                GUOthers ->
                    L.concat [ [ background ], pred, othersLambda ]

        instr =
            if p.isTtrl then
                []

            else
                M.withDefault []
                    << M.map
                        (\t ->
                            buildMessage
                                { x = cCenterX
                                , y = (cCenterY - dBoardSize / 2) / 2
                                , anchor = xy 0.5 0.5
                                , text = t
                                , prefix = gameInstrId
                                , instrLength = game.instrLength
                                }
                        )
                <|
                    getGameInstrText p.player game.stage
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
        ++ instr


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
        |> fill CO.white
        |> stroke CO.black 2
        |> hoverFill (grays 18)
        |> activeFill (grays 16)
        |> pointerEvents VisiblePainted
        |> onClick c.clickMsg
        |> M.withDefault identity (M.map id c.id)
        |> onLayer 4
    , textC c.text { x = c.x, y = c.y, size = 24 }
        |> onLayer 4
    ]


viewMovingNumber : { x : Float, y : Float, v : Float, w : Float, payoff : Float, hue : Hue } -> List (Element msg)
viewMovingNumber c =
    let
        scale =
            1 + c.v / 10

        r =
            5
    in
    [ rRectC { x = c.x, y = c.y, w = (c.w + r * 2) * scale, h = (fBarNumber + r * 2) * scale, r = r * scale }
        |> fill CO.white
        |> onLayer 1
    , textC (formatPayoff <| c.payoff * payoffScale) { x = c.x, y = c.y, size = fBarNumber * scale }
        |> fill (c.hue lBarNumber)
        |> tabularNums
        |> onLayer 1
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
                ( "Blue’s turn", hCpr )

        offset =
            15
    in
    [ rRectC { x = x, y = y, w = 150, h = 80, r = 10 }
        |> fill CO.white
        |> stroke (grays 5) 2
    , textC ("Round " ++ ST.fromInt c.round ++ "/" ++ ST.fromInt c.totalRounds) { x = x, y = y - offset, size = 24 }
        |> fill (grays 5)
    , textC roleText { x = x, y = y + offset, size = 24 }
        |> fill (roleHue 10)
    ]


viewStepCounter : Int -> List (Element msg)
viewStepCounter s =
    let
        x =
            120

        y =
            80

        offset =
            15
    in
    L.map (onLayer 2)
        [ rRectC { x = x, y = y, w = 150, h = 80, r = 10 }
            |> fill CO.white
            |> stroke (grays 5) 2
        , textC "[b|Tutorial]" { x = x, y = y - offset, size = 24 }
            |> fill (grays 5)
        , textC ("Step " ++ ST.fromInt s ++ "/" ++ ST.fromInt (A.length ttrlSteps)) { x = x, y = y + offset, size = 24 }
            |> fill (grays 5)
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
            if activeGame.cprActed || not (isShowing GUCprStatus gameProps.show) then
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

        keyDecoder : D.Decoder Msg
        keyDecoder =
            D.map keyToMsg (D.field "key" D.string)

        keyToMsg : String -> Msg
        keyToMsg s =
            case s of
                "k" ->
                    PrevStep

                "j" ->
                    NextStep False

                _ ->
                    NoOp
    in
    Sub.batch
        [ stateLoaded (StateLoaded << D.decodeValue modelDecoder)
        , gotTextLengths (GotTextLengths << D.decodeValue (D.dict D.float))
        , mouseDownUp
        , mouseMove
        , windowResize
        , loadingStep
        , wrappedSubs
        , BE.onKeyDown keyDecoder
        ]


subsToWrap : GameModel -> Sub Msg
subsToWrap game =
    let
        animationFrame =
            if L.member game.stage [ CollectPays, CollectPredPay ] then
                BE.onAnimationFrame (Time.posixToMillis >> Animate)

            else
                Sub.none
    in
    animationFrame



-- CONSTANTS --


initStage : ExptStage
initStage =
    ESTest


ttrlWaitSpeedRatio : Float
ttrlWaitSpeedRatio =
    1


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
    150 / dBoardSize


dlTotalOffset : Float
dlTotalOffset =
    100 / dBoardSize


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


dlPredPaySep : Float
dlPredPaySep =
    25 / dBoardSize


cCenterX : Float
cCenterX =
    dFullWidth / 2


cCenterY : Float
cCenterY =
    dFullHeight / 2 - 20


clIconX : Float
clIconX =
    -dlIconOffset


clTotalY : Float
clTotalY =
    0.5 - dlTotalOffset


cNwX : Float
cNwX =
    cCenterX - dBoardSize / 2


cNwY : Float
cNwY =
    cCenterY - dBoardSize / 2


clOppBarY : Float
clOppBarY =
    -dlBarSep


clSlfBarX : Float
clSlfBarX =
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
        , ( "discard", grays 10 )
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
    20


boardId : String
boardId =
    "board"


sliderId : String
sliderId =
    "slider"


thumbId : String
thumbId =
    "thumb"


predictionThumbId : String
predictionThumbId =
    "predictionThumb"


slfBarNumberId : String
slfBarNumberId =
    "slfBarNumber"


oppBarNumberId : String
oppBarNumberId =
    "oppBarNumber"


predPayId : String
predPayId =
    "predPay"


prevButtonId : String
prevButtonId =
    "prevButton"


nextButtonId : String
nextButtonId =
    "nextButton"


cprStatusId : String
cprStatusId =
    "cprStatus"


pttIconId : String
pttIconId =
    "pttIcon"


cprIconId : String
cprIconId =
    "cprIcon"


pttTotalId : String
pttTotalId =
    "pttTotal"


ttrlInstrId : String
ttrlInstrId =
    "ttrlInstr"


gameInstrId : String
gameInstrId =
    "gameInstr"


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
            , anchor = xy 0 0
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
                    { target = nextButtonId
                    , sep = 10
                    , text = dedent """
                        Let's start with a [b|tutorial] of the experiment.
                        It takes about 4 minutes. In this tutorial,
                        use these two buttons to step forward/backward.
                        """
                    , targetAnchor = xy 0.6 0
                    , instrAnchor = xy 0.4 1
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
                    , targetAnchor = xy 1 0
                    , instrAnchor = xy 0 1
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
                    , targetAnchor = xy 1 0
                    , instrAnchor = xy 0 1
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
                    , targetAnchor = xy 0 0
                    , instrAnchor = xy 1 1
                    }
            , proceed = ProceedAfterWait 6
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
                    , targetAnchor = xy 0.7 0.2
                    , instrAnchor = xy 0.3 1
                    }
            , proceed = ProceedAfterWait 2
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
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.2 1
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
                        Now try dragging the “handle”
                        along the track.
                        """
                    , targetAnchor = xy 1 0
                    , instrAnchor = xy 0.2 1
                    }
            , proceed = ProceedOnMsg touched
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay ]
            , instr =
                Callout
                    { target = slfBarNumberId
                    , sep = 10
                    , text = dedent """
                        The [b|vertical] location of the handle
                        corresponds to a [ptt b|reward for you],
                        which is proportional to the length of the [ptt b|red bar].
                        Now drag the handle to see how the reward changes.
                        """
                    , targetAnchor = xy 0.8 0
                    , instrAnchor = xy 0.2 1
                    }
            , proceed = ProceedOnMsg touched
            , cmd = Just << getBarNumberLengths <| ShowSome [ GUSlfPay ]
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUOppPay ]
            , instr =
                Callout
                    { target = oppBarNumberId
                    , sep = 10
                    , text = dedent """
                        The [b|horizontal] location
                        of the handle corresponds to
                        a [cpr b|reward for Blue],
                        which is proportional to
                        the length of the [cpr b|blue bar].
                        Now drag the handle to see
                        how the reward changes.
                        """
                    , targetAnchor = xy 0.8 0
                    , instrAnchor = xy 0.15 1
                    }
            , proceed = ProceedOnMsg touched
            , cmd = Just << getBarNumberLengths <| ShowSome [ GUOppPay ]
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY - dBoardSize / 2 - 40
                    , text = dedent """
                        Now drag the handle to see
                        how both rewards change simultaneously.
                        """
                    , anchor = xy 0.5 1
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
                        Drag the handle to the position
                        where the [b|two rewards] look the best to you.
                        After that, click the “Confirm” button.
                        """
                    , targetAnchor = xy 1 0.9
                    , instrAnchor = xy 0 0.1
                    }
            , proceed = ProceedOnMsg (\m _ -> m == GoTo PostAct)
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY - dBoardSize / 2 - 40
                    , text = dedent """
                        Then the two rewards will be added
                        to [ptt|your total] and [cpr|Blue's total].
                        """
                    , anchor = xy 0.5 1
                    , dim = False
                    }
            , proceed = ProceedOnMsg collected
            , cmd = P.sleep 1000 |> T.perform (always <| GoTo CollectPays) |> Just
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                Callout
                    { target = pttTotalId
                    , sep = 5
                    , text = dedent """
                        At the end of the experiment, you will be given
                        a [b|real monetary bonus] according to [ptt|your total reward]
                        (not the exact amount, but a transformation of it).
                        The higher your total reward is, the higher
                        your bonus will be. [b|Same for ][cpr b|Blue].
                        """
                    , targetAnchor = xy 1 0
                    , instrAnchor = xy 0 1
                    }
            , proceed = ProceedAfterWait 4
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                Callout
                    { target = thumbId
                    , sep = 5
                    , text = dedent """
                        After the rewards are collected, you can drag [ptt|your handle]
                        to review the options that were available to you.
                        Once you release the mouse, the handle will return
                        to [ptt|your actual decision]. Now try dragging [ptt|your handle].
                        """
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.5 1
                    }
            , proceed = ProceedOnMsg touched
            , gameMsg = Just <| GoTo Review
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUConfirmButton ]
            , instr =
                Callout
                    { target = confirmButtonId
                    , sep = 5
                    , text = dedent """
                        Once you are done reviewing,
                        click the “Next round” button
                        to go to the next round.
                        """
                    , targetAnchor = xy 1 0.9
                    , instrAnchor = xy 0 0.1
                    }
            , proceed = ProceedOnMsg (\m _ -> m == NextRound)
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay ]
            , instr =
                Callout
                    { target = sliderId
                    , sep = 5
                    , text = dedent """
                        Now it's [cpr|Blue's] turn.
                        [cpr|Blue] also makes a decision
                        on a slider on the board.
                        """
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.8 1
                    }
            , player = Cpr
            , proceed = ProceedAfterWait 2
            , gameMsg = Just <| GoTo PreAct
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUCprStatus ]
            , instr =
                Callout
                    { target = cprStatusId
                    , sep = 5
                    , text = dedent """
                        When [cpr|Blue] is thinking,
                        this icon will be displayed.
                        """
                    , targetAnchor = xy 0.2 0
                    , instrAnchor = xy 0.8 1
                    }
            , player = Cpr
            , proceed = ProceedAfterWait 1.5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUCprStatus ]
            , instr =
                Callout
                    { target = cprStatusId
                    , sep = 5
                    , text = dedent """
                        When [cpr|Blue] has made a decision,
                        the icon will change to a check mark.
                        """
                    , targetAnchor = xy 0.2 0
                    , instrAnchor = xy 0.8 1
                    }
            , player = Cpr
            , proceed = ProceedAfterWait 1.5
            , gameMsg = Just CprAct
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUCprStatus ]
            , instr =
                StaticInstr
                    { x = cCenterX + 30
                    , y = 10
                    , text = dedent """
                        When [cpr|Blue] is making their decision, you need to predict
                        where [cpr|Blue] will place the handle. Now drag the handle
                        to the location that reflects your prediction, in the same way
                        you made your decision in your turn. Note that now the [b|horizontal] bar
                        is the reward for [ptt b|you] and the [b|vertical] bar is the reward for [cpr b|Blue].
                        """
                    , anchor = xy 0.5 0
                    , dim = False
                    }
            , player = Cpr
            , proceed = ProceedOnMsg touched
            , gameMsg = Just <| GoTo Act
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = thumbId
                    , sep = 5
                    , text = dedent """
                        After you click the “Confirm” button, your
                        confirmed prediction will be represented by a red circle.
                        [cpr|Blue] won't be able to see your prediction.
                        Now click the “Confirm” button.
                        """
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.5 1
                    }
            , player = Cpr
            , proceed = ProceedOnMsg (\m _ -> m == GoTo PostAct)
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = 30
                    , text = dedent """
                        When both [ptt|you] have made your prediction
                        and [cpr|Blue] has made their decision,
                        [cpr|Blue's] decision will be revealed,
                        and the actual rewards will be collected.
                        """
                    , anchor = xy 0.5 0
                    , dim = False
                    }
            , player = Cpr
            , proceed = ProceedOnMsg collected
            , gameMsg = Just CprAct
            , cmd = P.sleep 1000 |> T.perform (always <| GoTo ShowCpr) |> Just
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUCprStatus ]
            , instr =
                Callout
                    { target = thumbId
                    , sep = 5
                    , text = dedent """
                        Like in your turn, after the rewards are collected,
                        you can drag [cpr|Blue's handle] to review the options
                        that were available to them. Now try dragging [cpr|Blue's handle].
                        """
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.5 1
                    }
            , player = Cpr
            , proceed = ProceedOnMsg touched
            , gameMsg = Just <| GoTo Review
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = cprStatusId
                    , sep = 5
                    , text = dedent """
                        When you are making your decision in [ptt|your turn],
                        [cpr|Blue] is also predicting your decision.
                        """
                    , targetAnchor = xy 0.2 0
                    , instrAnchor = xy 0.8 1
                    }
            , proceed = ProceedAfterWait 2
            , gameMsg = Just <| GoTo PreAct
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = cprStatusId
                    , sep = 5
                    , text = dedent """
                        When [cpr|Blue] has confirmed their prediction,
                        this icon will change to a check mark.
                        You won't be able to see [cpr|Blue's] prediction either.
                        """
                    , targetAnchor = xy 0.2 0
                    , instrAnchor = xy 0.8 1
                    }
            , proceed = ProceedAfterWait 3
            , gameMsg = Just CprAct
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY
                    , text = dedent """
                        To recap, when it's [ptt|your turn]:
                        (1) You make a decision on [ptt|your slider],
                        while [cpr|Blue] predicts your decision;
                        (2) You click “Confirm” to confirm your decision;
                        (3) The rewards are collected; and
                        (4) You review the available options for [ptt|yourself].
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , proceed = ProceedAfterWait 6
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY
                    , text = dedent """
                        When it's [cpr|Blue's turn]:
                        (1) [cpr|Blue] makes a decision on [cpr|their slider],
                        while [ptt|you] predict their decision;
                        (2) You click “Confirm” to confirm your prediction;
                        (3) Your prediction changes to a [ptt|red circle];
                        (4) [cpr|Blue's decision] is revealed;
                        (5) The rewards are collected; and
                        (6) You review the available options for [cpr|Blue].
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , player = Cpr
            , proceed = ProceedAfterWait 6
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY
                    , text = dedent """
                        The [b|locations] of [ptt|your slider] and [cpr|Blue's slider] change from round to round,
                        which means the possible combinations of the [ptt|reward for you]
                        and the [cpr|reward for Blue] are different across rounds.
                        So pay attention to how the [b|actual rewards]
                        compare with the available options [b|in each round].
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , proceed = ProceedAfterWait 5
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY
                    , text = dedent """
                        There are 3 types of [b|special rounds] interspersed among all the rounds,
                        which are explained in the next 3 steps of this tutorial.
                        [cpr|Blue] also has these special rounds.
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , proceed = ProceedAfterWait 3
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = oppBarNumberId
                    , sep = 5
                    , text = dedent """
                        In the first type of special rounds,
                        the color of the [b|horizontal] reward
                        will be [b discard|gray], which indicates that this reward
                        will be [b|discarded] instead of being given to [cpr|Blue]
                        (or [ptt|you] when it's [cpr|Blue's turn]).
                        """
                    , targetAnchor = xy 0.9 0
                    , instrAnchor = xy 0.1 1
                    }
            , oppReceiver = Discard
            , proceed = ProceedAfterWait 4
            , gameMsg = Just <| GoTo PostAct
            , cmd = Just <| getBarNumberLengths ShowAll
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = oppBarNumberId
                    , sep = 5
                    , text = dedent """
                        In the second type of special rounds,
                        the color of the [b|horizontal] reward
                        will be [b ptt|red] (or [b cpr|blue] when it's [cpr|Blue's turn]),
                        which indicates that this reward
                        will be given to [b ptt|you] instead of [cpr|Blue]
                        (or [b cpr|blue] instead of [ptt|you] when it's [cpr|Blue's turn]),
                        [b|in addition to] the usual [b|vertical] reward.
                        """
                    , targetAnchor = xy 0.9 0
                    , instrAnchor = xy 0.1 1
                    }
            , oppReceiver = Slf
            , proceed = ProceedAfterWait 4
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY
                    , text = dedent """
                        In the third type of special rounds (called [b|Memory Checks]),
                        after you click “Next round”, you will be asked to reproduce
                        the locations of [ptt|your handle] (or [cpr|Blue's handle] when it's [cpr|Blue's turn])
                        on the slider. The reproduced location doesn't have to be
                        exactly the same as the true location, but try to be as close as possible
                        to what you remember. [b|We reserve the right to reject your data]
                        [b|if the errors in the reproductions are too large.]
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , proceed = ProceedAfterWait 8
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal, GUBoard, GUSlider, GUSlfPay, GUOppPay, GUCprStatus ]
            , instr =
                StaticInstr
                    { x = cCenterX
                    , y = cCenterY - dBoardSize / 2 - 20
                    , text = dedent """
                        Now try to reproduce the location
                        of the handle you just saw.
                        (This one doesn't count.)
                        """
                    , anchor = xy 0.5 1
                    , dim = False
                    }
            , proceed = ProceedOnMsg touched
            , gameMsg = Just <| GoTo Memory
          }
        ]



-- HELPER FUNCTIONS --


set : ((a -> a) -> b -> b) -> a -> b -> b
set setter =
    setter << always


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


setTtrlGame : (GameModel -> GameModel) -> TtrlModel -> TtrlModel
setTtrlGame f m =
    { m | game = f m.game }


setTtrlInstrLength : (Maybe Float -> Maybe Float) -> TtrlModel -> TtrlModel
setTtrlInstrLength f m =
    { m | instrLength = f m.instrLength }


setTestInstrLength : (Maybe Float -> Maybe Float) -> TestModel -> TestModel
setTestInstrLength f m =
    { m | instrLength = f m.instrLength }


setGameInstrLength : (Maybe Float -> Maybe Float) -> GameModel -> GameModel
setGameInstrLength f m =
    { m | instrLength = f m.instrLength }


setGameStage : (GameStage -> GameStage) -> GameModel -> GameModel
setGameStage f m =
    { m | stage = f m.stage }


updateInstrLength : String -> ((Maybe Float -> Maybe Float) -> a -> a) -> TextLengths -> a -> a
updateInstrLength prefix setter ls model =
    let
        maybeInstrLength =
            L.maximum << DI.values <| DI.filter (\k _ -> ST.startsWith prefix k) ls
    in
    model |> (maybeSet setter << M.map Just <| maybeInstrLength)


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
    { x = \x -> cNwX + (1 - x) * dBoardSize, y = \y -> cNwY + (1 - y) * dBoardSize }


calcParabola : BoardConfig -> QBezierConfig
calcParabola { location, vy, vx, scale } =
    let
        yLeft =
            vy - vx ^ 2 / scale

        ( y1, x1 ) =
            if yLeft >= 0 then
                ( yLeft, 0 )

            else
                ( 0, vx - sqrt (vy * scale) )

        yRight =
            vy - (1 - vx) ^ 2 / scale

        ( y2, x2 ) =
            if yRight >= 0 then
                ( yRight, 1 )

            else
                ( 0, vx + sqrt (vy * scale) )

        cy =
            y1 + (vx - x1) / scale * (x2 - x1)

        cx =
            (x1 + x2) / 2

        { xTf, yTf } =
            sliderLocationToTfs location
    in
    { x1 = xTf x1, y1 = yTf y1, cx = xTf cx, cy = yTf cy, x2 = xTf x2, y2 = yTf y2 }


tfParabola : CTransforms -> QBezierConfig -> QBezierConfig
tfParabola { x, y } c =
    { x1 = x c.x1, y1 = y c.y1, cx = x c.cx, cy = y c.cy, x2 = x c.x2, y2 = y c.y2 }


calcPayoffs : BoardConfig -> Float -> { slf : Float, opp : Float }
calcPayoffs { location, vy, vx, scale } lambda =
    let
        { xTf, yTf } =
            sliderLocationToTfs location
    in
    { opp = xTf << max 0 <| vx + lambda / 2 * scale
    , slf = yTf << max 0 <| vy - lambda ^ 2 / 4 * scale
    }


calcPredPayoff : Float -> Float -> Float
calcPredPayoff l1 l2 =
    max 0 <| 0.1 - 0.1 * abs (l1 - l2)


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


localXPtt : Float -> BBox -> Float
localXPtt x b =
    (x - b.x) / b.width


localXCpr : Float -> BBox -> Float
localXCpr x b =
    1 - (x - b.x) / b.width


xToLambda : BoardConfig -> Float -> Float
xToLambda c x =
    let
        { x1, x2 } =
            calcParabola c

        extraScale =
            case c.location of
                FullBoard ->
                    2

                Quadrant _ ->
                    4

        { xTf } =
            sliderLocationToTfs c.location
    in
    (clamp x1 x2 x - xTf c.vx) / c.scale * extraScale


defaultBoardConfig : BoardConfig
defaultBoardConfig =
    -- lambda_min = -1.5
    -- lambda_max = 2.5
    { location = FullBoard, vy = 0.78125, vx = 0.375, scale = 0.5 }


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
            , vy = c.vy + dVx
            , vx = c.vx + dVy
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
        { hSlf = hCpr, hOpp = hPtt, tfC = tfCpr, tfA = \{ x, y } -> { x = 1 - x, y = y }, tfTA = oppositeTextAnchor }


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


getTtrlInstrLengths : Int -> Cmd msg
getTtrlInstrLengths i =
    getTextLengths << L.map (buildMultilineId ttrlInstrId) << L.range 1 << L.length << ST.split "\n" <| getInstrText i


getGameInstrText : Player -> GameStage -> Maybe String
getGameInstrText p s =
    case ( p, s ) of
        ( Ptt, Act ) ->
            Just "Make a decision"

        ( Cpr, Act ) ->
            Just "Make a prediction"

        ( _, Memory ) ->
            Just "Memory check"

        _ ->
            Nothing


getGameInstrLengths : Player -> GameStage -> Cmd msg
getGameInstrLengths p s =
    let
        text =
            getGameInstrText p s
    in
    case text of
        Nothing ->
            C.none

        Just t ->
            getTextLengths
                << L.map (buildMultilineId gameInstrId)
                << L.range 1
                << L.length
                << ST.split "\n"
            <|
                t


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
                    C.none


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
    SE.unindent >> ST.trim >> ST.replace "'" "’"


ttrlGameProps : TtrlModel -> GameProps
ttrlGameProps m =
    let
        step =
            A.get (m.step - 1) ttrlSteps
    in
    { isTtrl = True
    , player = M.withDefault Ptt <| M.map .player step
    , boardConfig = defaultBoardConfig
    , oppReceiver = M.withDefault Opp <| M.map .oppReceiver step
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


collected : Msg -> TtrlModel -> Bool
collected msg model =
    case msg of
        Animate t ->
            let
                ( newModel, _ ) =
                    updateAnimate t model.game (ttrlGameProps model)
            in
            L.member newModel.stage [ PostCollectPays, PostCollectPredPay ]

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


xy : a -> b -> { x : a, y : b }
xy x y =
    { x = x, y = y }



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
        , ( "instrLength", encodeMFloat t.instrLength )
        , ( "showTtrl", E.bool t.showTtrl )
        , ( "ttrl", encodeTtrl t.ttrl )
        ]


testDecoder : D.Decoder TestModel
testDecoder =
    D.succeed
        (\g r i s t ->
            { game = g
            , round = r
            , instrLength = i
            , showTtrl = s
            , ttrl = t
            }
        )
        |> DP.required "game" gameDecoder
        |> DP.required "round" D.int
        |> DP.required "instrLength" mFloatDecoder
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
        , ( "instrLength", encodeMFloat g.instrLength )
        , ( "textLengths", E.dict identity E.float g.textLengths )
        , ( "animationStartTime", encodeMInt g.animationStartTime )
        , ( "slfAnimationState", encodeAnimationState g.slfAnimationState )
        , ( "oppAnimationState", encodeAnimationState g.oppAnimationState )
        , ( "loadingStep", E.int g.loadingStep )
        ]


gameDecoder : D.Decoder GameModel
gameDecoder =
    D.succeed
        (\s l fl p c pt m b i t a sa oa ls ->
            { stage = s
            , lambda = l
            , fixedLambda = fl
            , prediction = p
            , cprActed = c
            , pttTotal = pt
            , mouseStatus = m
            , board = b
            , instrLength = i
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
        |> DP.required "instrLength" mFloatDecoder
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

                CollectPays ->
                    "CollectPays"

                PostCollectPays ->
                    "PostCollectPays"

                ShowPredPay ->
                    "ShowPredPay"

                CollectPredPay ->
                    "CollectPredPay"

                PostCollectPredPay ->
                    "PostCollectPredPay"

                Review ->
                    "Review"

                PostReview ->
                    "PostReview"

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

        "CollectPays" ->
            D.succeed CollectPays

        "PostCollectPays" ->
            D.succeed PostCollectPays

        "ShowPredPay" ->
            D.succeed ShowPredPay

        "CollectPredPay" ->
            D.succeed CollectPredPay

        "PostCollectPredPay" ->
            D.succeed PostCollectPredPay

        "Review" ->
            D.succeed Review

        "PostReview" ->
            D.succeed PostReview

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
