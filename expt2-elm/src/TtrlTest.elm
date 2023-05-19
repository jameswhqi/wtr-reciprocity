port module TtrlTest exposing
    ( Msg(..)
    , Props
    , RoundData
    , TestModel
    , TestStage(..)
    , TtrlModel
    , encodeRoundData
    , encodeTest
    , encodeTtrl
    , gotTextLengths
    , initReal
    , initRealCmd
    , initTest
    , initTestCmd
    , initTtrl
    , initTtrlCmd
    , roundDataDecoder
    , subsTest
    , subsTtrl
    , svgToHtml
    , testDecoder
    , ttrlDecoder
    , ttrlSteps
    , updateTest
    , updateTtrl
    , viewTest
    , viewTtrl
    )

-- IMPORTS --

import Array as A
import Basics.Extra exposing (..)
import Browser.Dom as BD
import Browser.Events as BE
import Color as CO
import Colors exposing (..)
import Css
import Dict as DI
import Html.Styled as H
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
import Url.Parser as UP
import Url.Parser.Query as UQ
import Utils exposing (..)



-- TYPES --
-- ptt: participant
-- cpr: computer
-- slf: self
-- opp: opponent
-- ttrl: tutorial


type TestStage
    = PrePrtc
    | TtrlButton
    | Prtc
    | DonePrtc
    | Pairing
    | Paired
    | Flipped
    | Real
    | DoneReal


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


type alias Props =
    { debug : Bool
    , waitSpeedRatio : Float
    , nPrtcRounds : Int
    , nRealRounds : Int
    }


type alias TtrlModel =
    { game : GameModel
    , step : Int
    , latestStep : Int
    , instrLength : Maybe Float
    , readyForNext : Bool
    , gameStates : A.Array GameModel
    }


type alias TestModel =
    { stage : TestStage
    , game : GameModel
    , round : Int
    , instrLength : Maybe Float
    , readyForNext : Bool
    , history : List RoundData
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
    , actStartTime : Int
    , actStopTime : Int
    , reviewStartTime : Int
    , reviewStopTime : Int
    }


type alias RoundData =
    { round : Int
    , player : Player
    , boardConfig : BoardConfig
    , oppReceiver : OppReceiver
    , pttLambda : Maybe Float
    , predLambda : Maybe Float
    , cprLambda : Maybe Float
    , memory : Maybe Float
    , actTime : Float
    , reviewTime : Float
    }


type alias GameProps =
    { isTtrl : Bool
    , isPrtc : Bool
    , lastRound : Bool
    , player : Player
    , boardConfig : BoardConfig
    , cprLambda : Float
    , cprActTime : Maybe Float
    , oppReceiver : OppReceiver
    , show : Show GameUnit
    , memory : Bool
    }


type MouseStatus
    = UpOut
    | UpIn
    | DownOut
    | DownIn


type alias TextLengths =
    DI.Dict String Float


type Msg
    = NoOp
    | GotTextLengths (Result D.Error TextLengths)
    | PrevStep
    | NextStep Bool
    | TtrlProceed
    | TestGoTo TestStage
    | TestProceed
    | SwitchTtrl
    | MouseEnter
    | MouseLeave
    | MouseDown Point
    | MouseUp Point
    | MouseMove Point
    | WindowResize
    | GotBoard (Result BD.Error BD.Element)
    | NextRound
    | GameGoTo GameStage
    | Animate Int
    | LoadingStep
    | CprAct
    | GotTime GameStage Int
    | NormalGameMsg Msg
    | TestTtrlGameMsg Msg


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
    = StaticInstr StaticInstrConfig
    | Callout CalloutConfig


type alias StaticInstrConfig =
    { x : Float
    , y : Float
    , text : String
    , anchor : Anchor
    , dim : Bool
    }


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


type alias TestStageConfig =
    { modal : Maybe ModalConfig
    , gameMsg : Maybe Msg
    }


type alias ModalConfig =
    { instrText : String
    , waitTime : Float
    , nextStage : TestStage
    }



-- PORTS --


port getTextLengths : List String -> Cmd msg


port gotTextLengths : (D.Value -> msg) -> Sub msg



-- MODEL --


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
    , actStartTime = 0
    , actStopTime = 0
    , reviewStartTime = 0
    , reviewStopTime = 0
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
    { stage = PrePrtc
    , game = initGame
    , round = 1
    , instrLength = Nothing
    , readyForNext = False
    , history = []
    , showTtrl = False
    , ttrl = { initTtrl | latestStep = A.length ttrlSteps }
    }


initTestCmd : Props -> Cmd Msg
initTestCmd p =
    C.batch
        [ getBoard
        , getTestInstrLengths p PrePrtc
        , P.sleep (prePrtcWaitTime * 1000 / p.waitSpeedRatio)
            |> T.perform (always TestProceed)
        ]


initReal : TestModel
initReal =
    { stage = Real
    , game = { initGame | stage = Act }
    , round = 1
    , instrLength = Nothing
    , readyForNext = False
    , history = []
    , showTtrl = False
    , ttrl = { initTtrl | latestStep = A.length ttrlSteps }
    }


initRealCmd : Props -> Cmd Msg
initRealCmd p =
    C.batch
        [ getBoard
        , getGameInstrLengths Ptt Act
        , P.sleep ((A.get 0 randomThings.cprActTimes |> M.withDefault 0) * 1000 / p.waitSpeedRatio)
            |> T.perform (\_ -> NormalGameMsg CprAct)
        ]


updateTtrl : (Msg -> Msg) -> Msg -> Props -> TtrlModel -> ( TtrlModel, Cmd Msg )
updateTtrl gameWrapper msg p =
    let
        u1 m =
            case msg of
                GotTextLengths (Ok ls) ->
                    ( m |> updateInstrLength ttrlTestInstrId setTtrlInstrLength ls
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
                            updateGame identity msg1 p (ttrlGameProps m) m.game

                        ( game, gameCmd ) =
                            nextStep.gameMsg
                                |> M.map updateGameWithMsg
                                |> M.withDefault ( m.game, C.none )

                        ( readyForNext, proceedCmd ) =
                            case nextStep.proceed of
                                ProceedAfterWait t ->
                                    if m.step == m.latestStep && wait then
                                        ( False
                                        , P.sleep (t * 1000 / p.waitSpeedRatio)
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
                            , game = game
                            , gameStates = A.set (m.step - 1) m.game m.gameStates
                          }
                        , C.batch
                            [ proceedCmd
                            , M.withDefault C.none <| nextStep.cmd
                            , getTtrlInstrLengths <| m.step + 1
                            , gameCmd
                            ]
                        )

                NextRound ->
                    ( m |> set (setTtrlGame << setGameStage) PostReview, C.none )

                TtrlProceed ->
                    ( { m | readyForNext = True }, C.none )

                _ ->
                    ( m, C.none )

        u2 m =
            let
                step =
                    getStep m.step
            in
            ( case step.proceed of
                ProceedOnMsg f ->
                    if f msg m then
                        { m | readyForNext = True }

                    else
                        m

                _ ->
                    m
            , Cmd.none
            )

        u3 m =
            let
                ( game, gameCmd ) =
                    updateGame gameWrapper msg p (ttrlGameProps m) m.game
            in
            ( { m | game = game }, gameCmd )
    in
    chainUpdates [ u1, u2, u3 ]


updateTest : Msg -> Props -> TestModel -> ( TestModel, Cmd Msg )
updateTest msg p =
    let
        u1 m =
            case msg of
                GotTextLengths (Ok ls) ->
                    let
                        m1 =
                            if m.showTtrl then
                                m

                            else
                                m |> updateInstrLength ttrlTestInstrId setTestInstrLength ls
                    in
                    ( m1, C.none )

                NormalGameMsg msg1 ->
                    let
                        ( game, gameCmd ) =
                            updateGame NormalGameMsg msg1 p (testGameProps p m) m.game
                    in
                    ( { m | game = game }, gameCmd )

                TestTtrlGameMsg msg1 ->
                    let
                        ( ttrl, ttrlCmd ) =
                            updateTtrl TestTtrlGameMsg msg1 p m.ttrl
                    in
                    ( { m | ttrl = ttrl }, ttrlCmd )

                NextRound ->
                    if m.showTtrl then
                        ( m, C.none )

                    else if prtcStage m.stage then
                        if m.round == p.nPrtcRounds then
                            updateTest (TestGoTo DonePrtc) p m

                        else
                            updateTest (NormalGameMsg <| GameGoTo Act) p { m | round = m.round + 1 }

                    else if m.round == p.nRealRounds then
                        updateTest (TestGoTo DoneReal) p <| addRoundData m

                    else
                        let
                            m1 =
                                addRoundData m
                        in
                        updateTest (NormalGameMsg <| GameGoTo Act) p { m1 | round = m1.round + 1 }

                TestGoTo PrePrtc ->
                    ( m, C.none )

                TestGoTo stage ->
                    let
                        stageConfig =
                            getTestStageConfig p stage

                        getWaitCmd waitTime =
                            P.sleep (waitTime * 1000 / p.waitSpeedRatio)
                                |> T.perform (always TestProceed)

                        waitCmd =
                            if stage == Pairing then
                                P.sleep (randomThings.pairingTime * 1000 / p.waitSpeedRatio)
                                    |> T.perform (always <| TestGoTo Paired)

                            else
                                stageConfig.modal
                                    |> M.map (.waitTime >> getWaitCmd)
                                    |> M.withDefault C.none

                        round =
                            if stage == Flipped then
                                1

                            else
                                m.round

                        m1 =
                            { m
                                | stage = stage
                                , readyForNext = False
                                , instrLength = Nothing
                                , round = round
                            }

                        updateGameWithMsg msg1 =
                            updateGame NormalGameMsg msg1 p (testGameProps p m1) m.game

                        ( game, gameCmd ) =
                            stageConfig.gameMsg
                                |> M.map updateGameWithMsg
                                |> M.withDefault ( m.game, C.none )
                    in
                    ( { m1 | game = game }
                    , C.batch
                        [ waitCmd
                        , getTestInstrLengths p stage
                        , gameCmd
                        ]
                    )

                TestProceed ->
                    ( { m | readyForNext = True }, C.none )

                SwitchTtrl ->
                    let
                        c =
                            if not m.showTtrl && m.ttrl.step == 1 then
                                getTtrlInstrLengths 1

                            else
                                C.none
                    in
                    ( { m | showTtrl = not m.showTtrl }, c )

                NextStep _ ->
                    ( if m.ttrl.step == A.length ttrlSteps then
                        { m | showTtrl = False }

                      else
                        m
                    , C.none
                    )

                _ ->
                    ( m, C.none )

        addRoundData : TestModel -> TestModel
        addRoundData m =
            let
                gp =
                    testGameProps p m

                ( pttLambda, predLambda, cprLambda ) =
                    if gp.player == Ptt then
                        ( m.game.fixedLambda, Nothing, Nothing )

                    else
                        ( Nothing, m.game.prediction, m.game.fixedLambda )

                memory =
                    if gp.memory then
                        m.game.lambda

                    else
                        Nothing

                roundData =
                    { round = m.round
                    , player = gp.player
                    , boardConfig = gp.boardConfig
                    , oppReceiver = gp.oppReceiver
                    , pttLambda = pttLambda
                    , predLambda = predLambda
                    , cprLambda = cprLambda
                    , memory = memory
                    , actTime = toFloat (m.game.actStopTime - m.game.actStartTime) / 1000
                    , reviewTime = toFloat (m.game.reviewStopTime - m.game.reviewStartTime) / 1000
                    }
            in
            { m | history = roundData :: m.history }

        u2 m =
            if m.showTtrl then
                let
                    ( ttrl, ttrlCmd ) =
                        updateTtrl TestTtrlGameMsg msg p m.ttrl
                in
                ( { m | ttrl = ttrl }, ttrlCmd )

            else
                let
                    ( game, gameCmd ) =
                        updateGame NormalGameMsg msg p (testGameProps p m) m.game
                in
                ( { m | game = game }, gameCmd )

        u3 m =
            case msg of
                GotTime PostReview _ ->
                    if testGameProps p m |> .memory then
                        let
                            ( game, gameCmd ) =
                                updateGame NormalGameMsg (GameGoTo Memory) p (testGameProps p m) m.game
                        in
                        ( { m | game = game }, gameCmd )

                    else
                        updateTest NextRound p m

                _ ->
                    ( m, C.none )
    in
    chainUpdates [ u1, u2, u3 ]


updateGame : (Msg -> Msg) -> Msg -> Props -> GameProps -> GameModel -> ( GameModel, Cmd Msg )
updateGame wrapper msg p gp model =
    let
        localX =
            if gp.player == Ptt then
                localXPtt

            else
                localXCpr

        getLambda x =
            Just << xToLambda gp.boardConfig <| localX x model.board

        wrap =
            C.map wrapper

        u1 m =
            case msg of
                GotTextLengths (Ok ls) ->
                    let
                        m1 =
                            m |> updateInstrLength gameInstrId setGameInstrLength ls

                        pred k _ =
                            L.all (\i -> not <| ST.startsWith i k) [ ttrlTestInstrId, gameInstrId ]

                        newLengths =
                            DI.union (DI.filter pred ls) m.textLengths
                    in
                    ( { m1 | textLengths = newLengths }, C.none )

                MouseEnter ->
                    let
                        mouseStatus =
                            if m.mouseStatus == UpOut then
                                UpIn

                            else
                                m.mouseStatus
                    in
                    ( { m | mouseStatus = mouseStatus }, C.none )

                MouseLeave ->
                    let
                        mouseStatus =
                            if m.mouseStatus == UpIn then
                                UpOut

                            else
                                m.mouseStatus
                    in
                    ( { m | mouseStatus = mouseStatus }, C.none )

                MouseDown { x, y } ->
                    let
                        ( lambda, c ) =
                            if isActiveStage m.stage then
                                ( getLambda x, getBarNumberLengths gp.show )

                            else
                                ( m.lambda, C.none )
                    in
                    if inBBox x y m.board then
                        ( { m | mouseStatus = DownIn, lambda = lambda }, c )

                    else
                        ( { m | mouseStatus = DownOut }, C.none )

                MouseUp { x, y } ->
                    let
                        mouseStatus =
                            if inBBox x y m.board then
                                UpIn

                            else
                                UpOut

                        lambda =
                            if m.fixedLambda == Nothing || m.stage == Memory then
                                m.lambda

                            else
                                m.fixedLambda
                    in
                    ( { m | mouseStatus = mouseStatus, lambda = lambda }, C.none )

                MouseMove { x } ->
                    ( { m | lambda = getLambda x }
                    , getBarNumberLengths gp.show
                    )

                WindowResize ->
                    ( m, getBoard )

                GotBoard (Ok { element }) ->
                    ( { m | board = element }, C.none )

                GameGoTo PreAct ->
                    let
                        ( pttTotal, c ) =
                            if gp.isTtrl || gp.isPrtc then
                                ( m.pttTotal, C.none )

                            else
                                ( 0
                                , P.sleep ((A.get 0 randomThings.cprActTimes |> M.withDefault 0) * 1000 / p.waitSpeedRatio)
                                    |> T.perform (\_ -> CprAct)
                                    |> wrap
                                )
                    in
                    ( { m
                        | stage = PreAct
                        , lambda = Nothing
                        , fixedLambda = Nothing
                        , cprActed = False
                        , prediction = Nothing
                        , pttTotal = pttTotal
                      }
                    , c
                    )

                GameGoTo Act ->
                    let
                        cprActed =
                            if gp.isTtrl || gp.isPrtc then
                                False

                            else
                                m.cprActed

                        c1 =
                            if gp.isTtrl || not gp.isPrtc then
                                C.none

                            else
                                P.sleep 200 |> T.perform (\_ -> CprAct) |> wrap

                        c2 =
                            getTime gp Act
                    in
                    ( { m
                        | stage = Act
                        , lambda = Nothing
                        , fixedLambda = Nothing
                        , cprActed = cprActed
                        , prediction = Nothing
                      }
                    , C.batch [ c1, c2 ]
                    )

                GameGoTo PostAct ->
                    let
                        m1 =
                            case gp.player of
                                Ptt ->
                                    { m | stage = PostAct, lambda = newLambda, fixedLambda = newLambda }

                                Cpr ->
                                    { m | stage = PostAct, lambda = Nothing, prediction = newLambda }

                        newLambda =
                            Just << M.withDefault 0.5 <| m.lambda

                        c1 =
                            if m.cprActed && not gp.isTtrl then
                                P.sleep 1000 |> T.perform (always <| GameGoTo newStage) |> wrap

                            else
                                C.none

                        newStage =
                            if gp.player == Ptt then
                                CollectPays

                            else
                                ShowCpr

                        c2 =
                            getTime gp PostAct
                    in
                    ( m1, C.batch [ c1, c2 ] )

                GameGoTo PostReview ->
                    ( { m | stage = PostReview }, getTime gp PostReview )

                GameGoTo Memory ->
                    ( { m | stage = Memory, lambda = Nothing }, C.none )

                GameGoTo ShowCpr ->
                    ( { m | stage = ShowCpr, lambda = Just gp.cprLambda, fixedLambda = Just gp.cprLambda }
                    , P.sleep 1000 |> T.perform (\_ -> GameGoTo CollectPays) |> wrap
                    )

                GameGoTo CollectPays ->
                    let
                        getC cprActTime =
                            P.sleep (cprActTime * 1000 / p.waitSpeedRatio)
                                |> T.perform (\_ -> CprAct)
                                |> wrap
                    in
                    ( { m | stage = CollectPays, cprActed = False }
                    , C.batch
                        [ getBarNumberLengths gp.show
                        , gp.cprActTime |> M.map getC |> M.withDefault C.none
                        ]
                    )

                GameGoTo ShowPredPay ->
                    let
                        getStage pay =
                            if roundPayoff (pay * payoffScale) == 0 then
                                if gp.isTtrl then
                                    PostCollectPredPay

                                else
                                    Review

                            else
                                CollectPredPay

                        stage =
                            M.map2 calcPredPayoff m.prediction m.fixedLambda
                                |> M.map getStage
                                |> M.withDefault Review

                        c =
                            if stage == Review then
                                getTime gp Review

                            else
                                C.none
                    in
                    ( { m | stage = ShowPredPay }
                    , C.batch
                        [ getTextLengths [ predPayId ]
                        , P.sleep 1000 |> T.perform (\_ -> GameGoTo stage) |> wrap
                        , c
                        ]
                    )

                GameGoTo CollectPredPay ->
                    ( { m | stage = CollectPredPay }, C.none )

                GameGoTo stage ->
                    ( { m | stage = stage }, C.none )

                Animate t ->
                    updateAnimate t m gp

                LoadingStep ->
                    ( { m | loadingStep = m.loadingStep + 1 }, C.none )

                CprAct ->
                    let
                        c =
                            if m.stage == PostAct && not gp.isTtrl then
                                P.sleep 1000 |> T.perform (always <| GameGoTo stage) |> wrap

                            else
                                C.none

                        stage =
                            if gp.player == Ptt then
                                CollectPays

                            else
                                ShowCpr
                    in
                    ( { m | cprActed = True }, c )

                GotTime Act t ->
                    ( { m | actStartTime = t }, C.none )

                GotTime PostAct t ->
                    ( { m | actStopTime = t }, C.none )

                GotTime Review t ->
                    ( { m | reviewStartTime = t }, C.none )

                GotTime PostReview t ->
                    ( { m | reviewStopTime = t }, C.none )

                _ ->
                    ( m, C.none )

        u2 m =
            if model.stage /= m.stage then
                ( { m | instrLength = Nothing }, getGameInstrLengths gp.player m.stage )

            else
                ( m, C.none )
    in
    chainUpdates [ u1, u2 ] model


getTime : GameProps -> GameStage -> Cmd Msg
getTime p stage =
    if p.isTtrl || p.isPrtc then
        C.none

    else
        Time.now |> T.perform (Time.posixToMillis >> GotTime stage)


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

                    else if m.stage == CollectPredPay && m.slfAnimationState /= Nothing && slfAnimationState == Nothing then
                        m.pttTotal + (roundPayoff <| (M.withDefault 0 <| M.map2 calcPredPayoff m.fixedLambda m.prediction) * payoffScale)

                    else
                        m.pttTotal

                ( stage, animationStartTime, c1 ) =
                    if slfAnimationState == Nothing && oppAnimationState == Nothing then
                        ( if m.stage == CollectPays && (p.isTtrl || p.player == Cpr) then
                            PostCollectPays

                          else if m.stage == CollectPredPay && p.isTtrl then
                            PostCollectPredPay

                          else
                            Review
                        , Nothing
                        , if m.stage == CollectPays && not p.isTtrl && p.player == Cpr then
                            P.sleep 1000 |> T.perform (always <| GameGoTo ShowPredPay)

                          else
                            C.none
                        )

                    else
                        ( m.stage, m.animationStartTime, C.none )

                c2 =
                    if stage == Review then
                        getTime p Review

                    else
                        C.none
            in
            ( { m
                | slfAnimationState = slfAnimationState
                , oppAnimationState = oppAnimationState
                , pttTotal = pttTotal
                , stage = stage
                , animationStartTime = animationStartTime
              }
            , C.batch [ c1, c2 ]
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



-- VIEW --


svgToHtml : List (Element Msg) -> H.Html Msg
svgToHtml =
    LE.stableSortWith (\(Element _ s1) (Element _ s2) -> compare s1.layer s2.layer)
        >> L.concatMap draw
        >> S.svg
            -- [ SA.width "100%"
            -- , SA.height <| ST.fromFloat dFullHeight
            [ SA.viewBox << ST.join " " << L.map ST.fromFloat <| [ 0, 0, dFullWidth, dFullHeight ]
            , SA.pointerEvents "none"
            , SA.css
                [ -- Css.fontFamilies [ "Helvetica", "Arial", "sans-serif" ]
                  -- Css.fontVariantNumeric Css.tabularNums
                  Css.width (Css.pct 100)
                , Css.maxHeight (Css.px 680)
                , Css.property "user-select" "none"
                , Css.property "-webkit-user-select" "none"
                , Css.display Css.block
                ]
            ]


viewTtrl : TtrlModel -> List (Element Msg)
viewTtrl m =
    let
        step =
            A.get (m.step - 1) ttrlSteps

        ( prevButton, nextButton ) =
            let
                text =
                    if m.step == A.length ttrlSteps then
                        "Finish"

                    else
                        "Next"
            in
            if m.readyForNext then
                ( viewButton
                    { x = cCenterX - 70
                    , y = cCenterY + 270
                    , w = 120
                    , h = 50
                    , text = "Previous"
                    , fontSize = 24
                    , clickMsg = PrevStep
                    , id = Just prevButtonId
                    }
                , viewButton
                    { x = cCenterX + 70
                    , y = cCenterY + 270
                    , w = 120
                    , h = 50
                    , text = text
                    , fontSize = 24
                    , clickMsg = NextStep True
                    , id = Just nextButtonId
                    }
                )

            else
                ( [], [] )
    in
    L.concat
        [ viewGame (ttrlGameProps m) m.game
        , prevButton
        , nextButton
        , viewStepCounter m.step
        ]
        |> M.withDefault identity
            (M.map
                (\s ->
                    addInstr s.instr m.instrLength m.game.textLengths
                )
                step
            )


viewTest : Props -> TestModel -> List (Element Msg)
viewTest p m =
    let
        ttrlTest =
            if m.showTtrl then
                viewTtrl m.ttrl

            else
                let
                    roundCounter =
                        viewRoundCounter
                            { round = m.round
                            , totalRounds = totalRounds
                            , player = roundToPlayer m.round
                            }

                    totalRounds =
                        if prtcStage m.stage then
                            p.nPrtcRounds

                        else
                            p.nRealRounds

                    nextStage =
                        getTestStageConfig p m.stage
                            |> .modal
                            |> M.map .nextStage
                            |> M.withDefault PrePrtc

                    okButton =
                        if m.readyForNext then
                            viewButton
                                { x = cCenterX
                                , y = cCenterY + 100
                                , w = 80
                                , h = 50
                                , text = "OK"
                                , fontSize = 24
                                , clickMsg = TestGoTo nextStage
                                , id = Nothing
                                }

                        else
                            []
                in
                L.concat [ viewGame (testGameProps p m) m.game, roundCounter, okButton ]
                    |> M.withDefault identity
                        (M.map
                            (\{ instrText } ->
                                addStaticInstr
                                    { x = cCenterX
                                    , y = cCenterY - 30
                                    , text = instrText
                                    , anchor = xy 0.5 0.5
                                    , dim = True
                                    }
                                    m.instrLength
                            )
                            << .modal
                         <|
                            getTestStageConfig p m.stage
                        )

        ttrlButton =
            if m.stage == PrePrtc then
                []

            else
                let
                    bText =
                        if m.showTtrl then
                            "Back to game"

                        else
                            "Tutorial"
                in
                viewButton
                    { x = tfCpr.x clIconX
                    , y = cCenterY + 270
                    , w = 100
                    , h = 30
                    , text = bText
                    , fontSize = 14
                    , clickMsg = SwitchTtrl
                    , id = Just ttrlButtonId
                    }
    in
    L.concat [ ttrlTest, ttrlButton ]


addInstr : Instr -> Maybe Float -> TextLengths -> List (Element msg) -> List (Element msg)
addInstr instr instrLength textLengths =
    case instr of
        StaticInstr c ->
            addStaticInstr c instrLength

        Callout c ->
            addElements c.target <| addCallout c instrLength textLengths


addStaticInstr : StaticInstrConfig -> Maybe Float -> List (Element msg) -> List (Element msg)
addStaticInstr c instrLength l =
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
            , prefix = ttrlTestInstrId
            , instrLength = instrLength
            , hide = False
            }
        ]


addCallout : CalloutConfig -> Maybe Float -> TextLengths -> Element msg -> List (Element msg)
addCallout c instrLength textLengths (Element shape _) =
    let
        arrowLength =
            50

        mTarget =
            case shape of
                Text t ->
                    M.map (\l -> getTextAnchorPos t l c.targetAnchor) targetTextLength

                s ->
                    Just <| getAnchorPos s c.targetAnchor

        targetTextLength =
            DI.get c.target textLengths

        arrowDir =
            { x = arrowDirX / arrowDirR, y = arrowDirY / arrowDirR }

        arrowDirX =
            c.instrAnchor.x - 0.5

        arrowDirY =
            c.instrAnchor.y - 0.5

        arrowDirR =
            vectorLength arrowDirX arrowDirY

        ( arrowEndX, arrowEndY ) =
            case mTarget of
                Just { x, y } ->
                    ( x - c.sep * arrowDir.x, y - c.sep * arrowDir.y )

                Nothing ->
                    ( 0, 0 )

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
            , prefix = ttrlTestInstrId
            , instrLength = instrLength
            , hide = mTarget == Nothing
            }


buildMessage : { x : Float, y : Float, anchor : Anchor, text : String, prefix : String, instrLength : Maybe Float, hide : Bool } -> List (Element msg)
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
                |> showOrHide

        showOrHide =
            if c.hide || c.instrLength == Nothing then
                hide

            else
                identity

        bg =
            M.map getBg fullW

        getBg w =
            rectC { x = centerX, y = centerY, w = w, h = fullH }
                |> stroke CO.black 3
                |> fill CO.white
                |> onLayer 3
                |> showOrHide
    in
    L.append (maybeToList bg) <| L.indexedMap drawLine lines


viewGame : GameProps -> GameModel -> List (Element Msg)
viewGame p m =
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
            isActiveStage m.stage && L.member m.mouseStatus [ UpIn, DownIn ]

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
            m.prediction
                |> M.map getPred
                |> M.withDefault []

        getPred predLambda =
            let
                payoffs =
                    calcPayoffs p.boardConfig predLambda

                cSliderX =
                    tfCpr.x payoffs.opp

                cSliderY =
                    tfCpr.y payoffs.slf

                predThumb =
                    circle { x = cSliderX, y = cSliderY, r = 7.5 }
                        |> stroke (hPtt 10) 2
                        |> fill (setAlpha 0.5 <| hPtt 17)

                --         |> addThumbId
                -- addThumbId =
                --     if m.stage == PostAct then
                --         id thumbId
                --     else
                --         identity
                predPay =
                    M.map (calcPredPayoff predLambda) m.fixedLambda

                predPayText =
                    predPay |> M.andThen getPredPayText

                getPredPayText pay =
                    if p.player == Cpr && L.member m.stage [ ShowPredPay, CollectPredPay, PostCollectPredPay, Review, PostReview ] then
                        Just
                            (textA (formatPayoff <| pay * payoffScale)
                                TAMiddle
                                { x = tfCpr.x <| payoffs.opp + 0.02 * predLambda
                                , y = tfCpr.y <| payoffs.slf + dlPredPaySep
                                , size = fBarNumber
                                }
                                |> id predPayId
                                |> fill (hOpp lBarNumber)
                                |> tabularNums
                            )

                    else
                        Nothing

                numberLength =
                    DI.get predPayId m.textLengths

                movingNumber =
                    M.map3 getMovingNumber predPay numberLength m.slfAnimationState

                getMovingNumber pay nl { x, y, v } =
                    viewMovingNumber { x = x, y = y, v = v, w = nl, payoff = pay, hue = hPtt }
            in
            if m.stage == Memory then
                []

            else
                L.concat [ [ predThumb ], maybeToList predPayText, M.withDefault [] movingNumber ]

        { slfPay, oppPay, confirmButton, othersLambda } =
            m.lambda
                |> M.map getLambdaDependent
                |> M.withDefault { slfPay = [], oppPay = [], confirmButton = [], othersLambda = [] }

        getLambdaDependent lambda =
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
                    M.map getButton buttonConfig |> M.withDefault []

                getButton { w, text, clickMsg } =
                    viewButton
                        { x = tfPtt.x clIconX
                        , y = cCenterY + 200
                        , w = w
                        , h = 50
                        , text = text
                        , fontSize = 24
                        , clickMsg = clickMsg
                        , id = Just confirmButtonId
                        }

                buttonConfig =
                    case m.stage of
                        Act ->
                            Just
                                { w = 120
                                , text = "Confirm"
                                , clickMsg = GameGoTo PostAct
                                }

                        Review ->
                            Just
                                { w = 140
                                , text =
                                    if p.lastRound then
                                        "Finish"

                                    else
                                        "Next round"
                                , clickMsg =
                                    if p.isTtrl || p.isPrtc then
                                        if p.memory then
                                            GameGoTo Memory

                                        else
                                            NextRound

                                    else
                                        GameGoTo PostReview
                                }

                        Memory ->
                            Just
                                { w = 140
                                , text =
                                    if p.lastRound then
                                        "Finish"

                                    else
                                        "Next round"
                                , clickMsg = NextRound
                                }

                        _ ->
                            Nothing

                slfBarNumberLength =
                    DI.get slfBarNumberId m.textLengths

                slfMovingBarNumber =
                    M.map2 getSlfMovingBarNumber slfBarNumberLength m.slfAnimationState
                        |> M.andThen identity
                        |> M.withDefault []

                getSlfMovingBarNumber nl { x, y, v } =
                    if m.stage == CollectPays then
                        Just <| viewMovingNumber { x = x, y = y, v = v, w = nl, payoff = payoffs.slf, hue = hSlf }

                    else
                        Nothing

                oppMovingBarNumber =
                    case m.oppAnimationState of
                        Nothing ->
                            []

                        Just { x, y, v } ->
                            let
                                numberLength =
                                    M.withDefault 0 <| DI.get oppBarNumberId m.textLengths
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

        cprStatus =
            let
                x =
                    tfCpr.x clIconX + 80

                y =
                    cCenterY

                getCircle i =
                    let
                        shift =
                            rotatePoint (45 * toFloat (m.loadingStep + i)) <| xy 0 20
                    in
                    circle { x = x + shift.x, y = y + shift.y, r = 2.5 + toFloat i * 0.25 }
                        |> fill (hCpr <| 18 - i)

                fg =
                    if m.cprActed || not (L.member m.stage [ PreAct, Act, PostAct ]) then
                        [ complexCW check { x = x, y = y, w = 40 }
                            |> fill (hCpr 10)
                        ]

                    else
                        L.range 0 7 |> L.map getCircle

                bg =
                    rectC { x = x, y = y, w = 50, h = 50 }
                        |> fill transparent
                        |> id cprStatusId
            in
            bg :: fg

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
                    viewTotal { x = tfPtt.x clIconX, y = tfPtt.y clTotalY, hue = hPtt, text = formatPayoff m.pttTotal, id = Just pttTotalId }

                GUCprTotal ->
                    viewTotal { x = tfCpr.x clIconX, y = tfCpr.y clTotalY, hue = hCpr, text = "****", id = Just cprTotalId }

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
                    cprStatus

                GUOthers ->
                    L.concat [ [ background ], pred, othersLambda ]

        instr =
            if p.isTtrl then
                []

            else
                getGameInstrText p.player m.stage
                    |> M.map getInstr
                    |> M.withDefault []

        getInstr text =
            buildMessage
                { x = cCenterX
                , y = (cCenterY - dBoardSize / 2) / 2
                , anchor = xy 0.5 0.5
                , text = text
                , prefix = gameInstrId
                , instrLength = m.instrLength
                , hide = False
                }
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


viewButton : { x : Float, y : Float, w : Float, h : Float, text : String, fontSize : Float, clickMsg : msg, id : Maybe String } -> List (Element msg)
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
    , textC c.text { x = c.x, y = c.y, size = c.fontSize }
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
        |> onLayer 4
    , textC (formatPayoff <| c.payoff * payoffScale) { x = c.x, y = c.y, size = fBarNumber * scale }
        |> fill (c.hue lBarNumber)
        |> tabularNums
        |> onLayer 4
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


subsTtrl : (Msg -> Msg) -> Bool -> Bool -> Props -> TtrlModel -> Sub Msg
subsTtrl gameWrapper topLevel visible p m =
    let
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
        [ subsGame gameWrapper visible m.game (ttrlGameProps m)
        , if p.debug then
            BE.onKeyDown keyDecoder

          else
            Sub.none
        , if topLevel then
            textLengthSub

          else
            Sub.none
        ]


subsTest : Props -> TestModel -> Sub Msg
subsTest p m =
    if m.showTtrl then
        Sub.batch
            [ subsGame NormalGameMsg False m.game (testGameProps p m)
            , subsTtrl TestTtrlGameMsg False True p m.ttrl
            , textLengthSub
            ]

    else
        Sub.batch
            [ subsGame NormalGameMsg True m.game (testGameProps p m)
            , subsTtrl TestTtrlGameMsg False False p m.ttrl
            , textLengthSub
            ]


textLengthSub : Sub Msg
textLengthSub =
    gotTextLengths (GotTextLengths << D.decodeValue (D.dict D.float))


subsGame : (Msg -> Msg) -> Bool -> GameModel -> GameProps -> Sub Msg
subsGame wrapper visible m p =
    let
        mouseDownUp =
            if isActiveStage m.stage then
                Sub.batch
                    [ BE.onMouseDown (D.map2 (pointThen MouseDown) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    , BE.onMouseUp (D.map2 (pointThen MouseUp) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    ]

            else
                Sub.none

        mouseMove =
            if isActiveStage m.stage && m.mouseStatus == DownIn then
                BE.onMouseMove (D.map2 (pointThen MouseMove) (D.field "pageX" D.float) (D.field "pageY" D.float))

            else
                Sub.none

        windowResize =
            BE.onResize (\_ _ -> WindowResize)

        animationFrame =
            if L.member m.stage [ CollectPays, CollectPredPay ] then
                BE.onAnimationFrame (Time.posixToMillis >> Animate) |> Sub.map wrapper

            else
                Sub.none

        loadingStep =
            if m.cprActed || not (isShowing GUCprStatus p.show) || not (L.member m.stage [ PreAct, Act, PostAct ]) then
                Sub.none

            else
                Time.every 200 (always LoadingStep)
    in
    if visible then
        Sub.batch
            [ mouseDownUp
            , mouseMove
            , windowResize
            , animationFrame
            , loadingStep
            ]

    else
        animationFrame



-- CONSTANTS --


minPairingTime : Float
minPairingTime =
    5


maxPairingTime : Float
maxPairingTime =
    30


randomThings :
    { prtcBoardConfigs : A.Array BoardConfig
    , realBoardConfigs : A.Array BoardConfig
    , realCprLambdaDeviates : A.Array Float
    , pairingTime : Float
    , cprActTimes : A.Array Float
    }
randomThings =
    let
        nPrtcRounds =
            6

        nRealRounds =
            20

        s0 =
            RA.initialSeed 3509

        ( pb, s1 ) =
            generateBoardConfigs nPrtcRounds s0

        ( rb, s2 ) =
            generateBoardConfigs nRealRounds s1

        ( rc, s3 ) =
            generateCprLambdaDeviates (nRealRounds // 2) s2

        ( pt, s4 ) =
            generatePairingTime s3

        ( ca, _ ) =
            generateCprActTimes nRealRounds s4
    in
    { prtcBoardConfigs = pb, realBoardConfigs = rb, realCprLambdaDeviates = rc, pairingTime = pt, cprActTimes = ca }


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


cprTotalId : String
cprTotalId =
    "cprTotal"


ttrlTestInstrId : String
ttrlTestInstrId =
    "ttrlTestInstr"


gameInstrId : String
gameInstrId =
    "gameInstr"


confirmButtonId : String
confirmButtonId =
    "confirmButton"


ttrlButtonId : String
ttrlButtonId =
    "ttrlButton"


payoffScale : Float
payoffScale =
    100


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
                        You start with a total reward of 0 points.
                        """
                    , targetAnchor = xy 1 0
                    , instrAnchor = xy 0 1
                    }
            , proceed = ProceedAfterWait 1.5
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon ]
            , instr =
                Callout
                    { target = cprIconId
                    , sep = 10
                    , text = dedent """
                        You will play a multi-round game
                        with a [cpr b|blue] player (we will call them [cpr|Blue]).
                        [cpr|Blue] will be a person randomly paired with you,
                        and they walk through exactly the same tutorial
                        as you do now.
                        """
                    , targetAnchor = xy 0 0
                    , instrAnchor = xy 1 1
                    }
            , proceed = ProceedAfterWait 3
          }
        , { defaultStep
            | gameShow = ShowSome [ GUOthers, GUPttIcon, GUPttTotal, GUCprIcon, GUCprTotal ]
            , instr =
                Callout
                    { target = cprTotalId
                    , sep = 10
                    , text = dedent """
                        [cpr|Blue] also starts with a total reward of 0 points,
                        but [cpr|their total] is hidden from you.
                        [ptt|Your total] is also hidden from [cpr|Blue].
                        """
                    , targetAnchor = xy 0 0
                    , instrAnchor = xy 1 1
                    }
            , proceed = ProceedAfterWait 3
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
            , gameMsg = Just <| GameGoTo Act
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
            , proceed = ProceedOnMsg (\m _ -> m == GameGoTo PostAct)
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
            , cmd = P.sleep 1000 |> T.perform (always <| GameGoTo CollectPays) |> Just
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
            , gameMsg = Just <| GameGoTo Review
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
            , gameMsg = Just <| GameGoTo PreAct
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
            , gameMsg = Just <| GameGoTo Act
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
            , proceed = ProceedOnMsg (\m _ -> m == GameGoTo PostAct)
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
            , cmd = P.sleep 1000 |> T.perform (always <| GameGoTo ShowCpr) |> Just
          }
        , { defaultStep
            | gameShow = ShowAll
            , instr =
                Callout
                    { target = predPayId
                    , sep = 5
                    , text = dedent """
                        You will be given a small bonus based on
                        how close your prediction is to [cpr|Blue's] actual decision.
                        The closer they are, the higher your bonus will be.
                        If your prediction is very far off, you won't receive any bonus.
                        """
                    , targetAnchor = xy 0.5 0
                    , instrAnchor = xy 0.5 1
                    }
            , player = Cpr
            , proceed = ProceedOnMsg (\msg m -> collected msg m || msg == GameGoTo PostCollectPredPay)
            , gameMsg = Just <| GameGoTo ShowPredPay
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
            , gameMsg = Just <| GameGoTo Review
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
            , gameMsg = Just <| GameGoTo PreAct
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
                        (5) The actual rewards are collected;
                        (6) You receive a [ptt|bonus] based on
                        how good your prediction was; and
                        (7) You review the available options for [cpr|Blue].
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
                        The possible rewards on the slider change from round to round,
                        so pay attention to the [b|actual rewards in each round].
                        """
                    , anchor = xy 0.5 0.5
                    , dim = True
                    }
            , proceed = ProceedAfterWait 2
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
            , gameMsg = Just <| GameGoTo PostAct
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
            , gameMsg = Just <| GameGoTo Memory
          }
        ]


prePrtcWaitTime : Float
prePrtcWaitTime =
    4



-- HELPER FUNCTIONS --


setTtrlGame : Setter TtrlModel GameModel
setTtrlGame f m =
    { m | game = f m.game }


setTtrlInstrLength : Setter TtrlModel (Maybe Float)
setTtrlInstrLength f m =
    { m | instrLength = f m.instrLength }


setTestInstrLength : Setter TestModel (Maybe Float)
setTestInstrLength f m =
    { m | instrLength = f m.instrLength }


setGameInstrLength : Setter GameModel (Maybe Float)
setGameInstrLength f m =
    { m | instrLength = f m.instrLength }


setGameStage : Setter GameModel GameStage
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


getTtrlInstrText : Int -> String
getTtrlInstrText i =
    M.withDefault "" << M.map (.instr >> instrToText) <| A.get (i - 1) ttrlSteps


instrToText : Instr -> String
instrToText i =
    case i of
        StaticInstr { text } ->
            text

        Callout { text } ->
            text


getTestInstrText : Props -> TestStage -> Maybe String
getTestInstrText p s =
    M.map .instrText << .modal <| getTestStageConfig p s


buildMultilineId : String -> Int -> String
buildMultilineId prefix i =
    prefix ++ "-" ++ ST.fromInt i


getTestStageConfig : Props -> TestStage -> TestStageConfig
getTestStageConfig p s =
    case s of
        PrePrtc ->
            { modal =
                Just
                    { instrText = "The following are " ++ ST.fromInt p.nPrtcRounds ++ " practice rounds.\n" ++ dedent """
                        [cpr|Blue] will be a bot, so it will make decisions very quickly.
                        After the practice rounds, you will be paired with a human to play the real game.
                        """
                    , waitTime = prePrtcWaitTime
                    , nextStage = TtrlButton
                    }
            , gameMsg = Nothing
            }

        TtrlButton ->
            { modal =
                Just
                    { instrText = dedent """
                        You can click the “Tutorial” button in the lower right
                        to review the tutorial any time.
                        """
                    , waitTime = 1
                    , nextStage = Prtc
                    }
            , gameMsg = Nothing
            }

        Prtc ->
            { modal = Nothing
            , gameMsg = Just <| GameGoTo Act
            }

        DonePrtc ->
            { modal =
                Just
                    { instrText = dedent """
                        Good job!
                        Now you will be paired with a human to play the real game.
                        """
                    , waitTime = 1
                    , nextStage = Pairing
                    }
            , gameMsg = Just <| GameGoTo PostReview
            }

        Pairing ->
            { modal =
                Just
                    { instrText =
                        "Waiting for another participant...\n"
                            ++ "(The wait time is usually "
                            ++ ST.fromFloat minPairingTime
                            ++ "–"
                            ++ ST.fromFloat maxPairingTime
                            ++ " seconds.)"
                    , waitTime = 1
                    , nextStage = Paired
                    }
            , gameMsg = Nothing
            }

        Paired ->
            { modal =
                Just
                    { instrText =
                        "Pairing success!\n"
                            ++ "You will play "
                            ++ ST.fromInt p.nRealRounds
                            ++ " rounds of the game with the other participant.\n"
                            ++ dedent """
                            We will programmatically flip a coin to decide
                            whether you or they go first...
                            """
                    , waitTime = 3
                    , nextStage = Flipped
                    }
            , gameMsg = Nothing
            }

        Flipped ->
            { modal =
                Just
                    { instrText =
                        "You are going first!\nGood luck!"
                    , waitTime = 1
                    , nextStage = Real
                    }
            , gameMsg = Just <| GameGoTo PreAct
            }

        Real ->
            { modal = Nothing
            , gameMsg = Just <| GameGoTo Act
            }

        DoneReal ->
            { modal =
                Just
                    { instrText =
                        "Congratulations! You have completed the game."
                    , waitTime = 1
                    , nextStage = PrePrtc
                    }
            , gameMsg = Nothing
            }


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


getBoard : Cmd Msg
getBoard =
    T.attempt GotBoard (BD.getElement boardId)


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


generateBoardConfigs : Int -> RA.Seed -> ( A.Array BoardConfig, RA.Seed )
generateBoardConfigs n seed =
    let
        ( l, s ) =
            State.run seed <| State.traverse (State.advance << RA.step) (L.repeat n randomBoardConfig)
    in
    ( A.fromList l, s )


randomLambdaDeviate : RA.Generator Float
randomLambdaDeviate =
    RA.map2 (+) (RA.float -0.1 0.1) (RA.float -0.1 0.1)


generateCprLambdaDeviates : Int -> RA.Seed -> ( A.Array Float, RA.Seed )
generateCprLambdaDeviates n seed =
    let
        ( l, s ) =
            State.run seed <| State.traverse (State.advance << RA.step) (L.repeat n randomLambdaDeviate)
    in
    ( A.fromList l, s )


generatePairingTime : RA.Seed -> ( Float, RA.Seed )
generatePairingTime =
    RA.step <| RA.float minPairingTime maxPairingTime


generateCprActTimes : Int -> RA.Seed -> ( A.Array Float, RA.Seed )
generateCprActTimes n seed =
    let
        minTime i =
            if i == 1 then
                10

            else
                max (20 - toFloat i) 10
                    + (if realMemoryRound i then
                        5

                       else
                        0
                      )

        getGen i =
            RA.float (minTime i) (minTime i + 5)

        ( l, s ) =
            State.run seed <| State.traverse (State.advance << RA.step) <| L.map getGen <| L.range 1 n
    in
    ( A.fromList l, s )


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


prtcOppReceiver : Int -> OppReceiver
prtcOppReceiver r =
    if L.member r [ 2, 5 ] then
        Slf

    else if L.member r [ 3, 4 ] then
        Discard

    else
        Opp


realOppReceiver : Int -> OppReceiver
realOppReceiver r =
    if L.member r [ 3, 13 ] then
        Slf

    else if L.member r [ 9, 15 ] then
        Discard

    else
        Opp


prtcMemoryRound : Int -> Bool
prtcMemoryRound r =
    L.member r [ 1, 4 ]


realMemoryRound : Int -> Bool
realMemoryRound r =
    L.member r [ 5, 17 ]


getPrtcBoardConfig : Int -> BoardConfig
getPrtcBoardConfig r =
    A.get (r - 1) randomThings.prtcBoardConfigs
        |> M.withDefault defaultBoardConfig


getRealBoardConfig : Int -> BoardConfig
getRealBoardConfig r =
    A.get (r - 1) randomThings.realBoardConfigs
        |> M.withDefault defaultBoardConfig


getPrtcCprLambda : Int -> Float
getPrtcCprLambda r =
    if prtcOppReceiver r == Slf then
        1

    else
        0


getRealCprLambda : Int -> Float
getRealCprLambda r =
    let
        base =
            case realOppReceiver r of
                Opp ->
                    1

                Slf ->
                    1

                Discard ->
                    0

        deviate =
            A.get (r // 2 - 1) randomThings.realCprLambdaDeviates
                |> M.withDefault 0
    in
    base + deviate


filterElements : Show unit -> List unit -> (unit -> List (Element msg)) -> List (Element msg)
filterElements show units f =
    case show of
        ShowAll ->
            L.concatMap f units

        ShowSome l ->
            L.concatMap f <| L.filter (flip L.member l) units


getTtrlInstrLengths : Int -> Cmd msg
getTtrlInstrLengths i =
    getTextLengths << L.map (buildMultilineId ttrlTestInstrId) << L.range 1 << L.length << ST.split "\n" <| getTtrlInstrText i


getTestInstrLengths : Props -> TestStage -> Cmd msg
getTestInstrLengths p s =
    getTestInstrText p s
        |> M.map
            (ST.split "\n"
                >> L.length
                >> L.range 1
                >> L.map (buildMultilineId ttrlTestInstrId)
                >> getTextLengths
            )
        |> M.withDefault C.none


getGameInstrText : Player -> GameStage -> Maybe String
getGameInstrText p s =
    case ( p, s ) of
        ( Ptt, Act ) ->
            Just "Make a decision"

        ( Cpr, Act ) ->
            Just "Make a prediction"

        ( _, Memory ) ->
            Just <|
                "[b|Memory check]\nTry to reproduce the location\nof "
                    ++ (if p == Ptt then
                            "[ptt|your handle]"

                        else
                            "[cpr|Blue's handle]"
                       )

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


setTestGame : (GameModel -> GameModel) -> TestModel -> TestModel
setTestGame f m =
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
    , isPrtc = False
    , lastRound = False
    , player = M.withDefault Ptt <| M.map .player step
    , boardConfig = defaultBoardConfig
    , cprLambda = 1
    , cprActTime = Nothing
    , oppReceiver = M.withDefault Opp <| M.map .oppReceiver step
    , show = M.withDefault ShowAll <| M.map .gameShow step
    , memory = False
    }


prtcStage : TestStage -> Bool
prtcStage s =
    L.member s [ PrePrtc, TtrlButton, Prtc, DonePrtc, Pairing, Paired ]


testGameProps : Props -> TestModel -> GameProps
testGameProps p m =
    let
        show =
            if L.member m.stage [ PrePrtc, TtrlButton ] then
                ShowSome [ GUBoard, GUPttIcon, GUCprIcon, GUPttTotal, GUCprTotal, GUSlfPay, GUOppPay, GUSlider, GUConfirmButton, GUOthers ]

            else
                ShowAll

        { boardConfig, cprLambda, oppReceiver, memory, lastRound, cprActTime } =
            if prtcStage m.stage then
                { boardConfig = getPrtcBoardConfig m.round
                , cprLambda = getPrtcCprLambda m.round
                , oppReceiver = prtcOppReceiver m.round
                , memory = prtcMemoryRound m.round
                , lastRound = m.round == p.nPrtcRounds
                , cprActTime = Nothing
                }

            else
                { boardConfig = getRealBoardConfig m.round
                , cprLambda = getRealCprLambda m.round
                , oppReceiver = realOppReceiver m.round
                , memory = realMemoryRound m.round
                , lastRound = m.round == p.nRealRounds
                , cprActTime = A.get m.round randomThings.cprActTimes
                }
    in
    { isTtrl = False
    , isPrtc = prtcStage m.stage
    , lastRound = lastRound
    , player = roundToPlayer m.round
    , boardConfig = boardConfig
    , cprLambda = cprLambda
    , cprActTime = cprActTime
    , oppReceiver = oppReceiver
    , show = show
    , memory = memory
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
        [ ( "stage", encodeTestStage t.stage )
        , ( "game", encodeGame t.game )
        , ( "round", E.int t.round )
        , ( "instrLength", encodeMFloat t.instrLength )
        , ( "readyForNext", E.bool t.readyForNext )
        , ( "history", E.list encodeRoundData t.history )
        , ( "showTtrl", E.bool t.showTtrl )
        , ( "ttrl", encodeTtrl t.ttrl )
        ]


testDecoder : D.Decoder TestModel
testDecoder =
    D.succeed
        (\s g r i re h st t ->
            { stage = s
            , game = g
            , round = r
            , instrLength = i
            , readyForNext = re
            , history = h
            , showTtrl = st
            , ttrl = t
            }
        )
        |> DP.required "stage" testStageDecoder
        |> DP.required "game" gameDecoder
        |> DP.required "round" D.int
        |> DP.required "instrLength" mFloatDecoder
        |> DP.required "readyForNext" D.bool
        |> DP.required "history" (D.list roundDataDecoder)
        |> DP.required "showTtrl" D.bool
        |> DP.required "ttrl" ttrlDecoder


encodeTestStage : TestStage -> E.Value
encodeTestStage s =
    let
        string =
            case s of
                PrePrtc ->
                    "PrePrtc"

                TtrlButton ->
                    "TtrlButton"

                Prtc ->
                    "Prtc"

                DonePrtc ->
                    "DonePrtc"

                Pairing ->
                    "Pairing"

                Paired ->
                    "Paired"

                Flipped ->
                    "Flipped"

                Real ->
                    "Real"

                DoneReal ->
                    "DoneReal"
    in
    E.string string


testStageDecoder : D.Decoder TestStage
testStageDecoder =
    D.string
        |> D.andThen
            (\s ->
                case s of
                    "PrePrtc" ->
                        D.succeed PrePrtc

                    "TtrlButton" ->
                        D.succeed TtrlButton

                    "Prtc" ->
                        D.succeed Prtc

                    "DonePrtc" ->
                        D.succeed DonePrtc

                    "Pairing" ->
                        D.succeed Pairing

                    "Paired" ->
                        D.succeed Paired

                    "Flipped" ->
                        D.succeed Flipped

                    "Real" ->
                        D.succeed Real

                    "DoneReal" ->
                        D.succeed DoneReal

                    _ ->
                        D.fail <| "Unknown test stage: " ++ s
            )


encodeGame : GameModel -> E.Value
encodeGame g =
    E.object
        [ ( "stage", encodeGameStage g.stage )
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
        , ( "actStartTime", E.int g.actStartTime )
        , ( "actStopTime", E.int g.actStopTime )
        , ( "reviewStartTime", E.int g.reviewStartTime )
        , ( "reviewStopTime", E.int g.reviewStopTime )
        ]


gameDecoder : D.Decoder GameModel
gameDecoder =
    D.succeed
        (\s l fl p c pt m b i t a sa oa ls a1 a2 r1 r2 ->
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
            , actStartTime = a1
            , actStopTime = a2
            , reviewStartTime = r1
            , reviewStopTime = r2
            }
        )
        |> DP.required "stage" gameStageDecoder
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
        |> DP.required "actStartTime" D.int
        |> DP.required "actStopTime" D.int
        |> DP.required "reviewStartTime" D.int
        |> DP.required "reviewStopTime" D.int


encodeRoundData : RoundData -> E.Value
encodeRoundData r =
    E.object
        [ ( "round", E.int r.round )
        , ( "player", encodePlayer r.player )
        , ( "boardConfig", encodeBoardConfig r.boardConfig )
        , ( "oppReceiver", encodeOppReceiver r.oppReceiver )
        , ( "pttLambda", encodeMFloat r.pttLambda )
        , ( "predLambda", encodeMFloat r.predLambda )
        , ( "cprLambda", encodeMFloat r.cprLambda )
        , ( "memory", encodeMFloat r.memory )
        , ( "actTime", E.float r.actTime )
        , ( "reviewTime", E.float r.reviewTime )
        ]


roundDataDecoder : D.Decoder RoundData
roundDataDecoder =
    D.succeed
        (\r p b o pt pr c m a re ->
            { round = r
            , player = p
            , boardConfig = b
            , oppReceiver = o
            , pttLambda = pt
            , predLambda = pr
            , cprLambda = c
            , memory = m
            , actTime = a
            , reviewTime = re
            }
        )
        |> DP.required "round" D.int
        |> DP.required "player" playerDecoder
        |> DP.required "boardConfig" boardConfigDecoder
        |> DP.required "oppReceiver" oppReceiverDecoder
        |> DP.required "pttLambda" mFloatDecoder
        |> DP.required "predLambda" mFloatDecoder
        |> DP.required "cprLambda" mFloatDecoder
        |> DP.required "memory" mFloatDecoder
        |> DP.required "actTime" D.float
        |> DP.required "reviewTime" D.float


encodeGameStage : GameStage -> E.Value
encodeGameStage s =
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


gameStageDecoder : D.Decoder GameStage
gameStageDecoder =
    D.string
        |> D.andThen
            (\s ->
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
                        D.fail <| "Unknown game stage: " ++ s
            )


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


encodeBoardConfig : BoardConfig -> E.Value
encodeBoardConfig b =
    E.object
        [ ( "location", encodeSliderLocation b.location )
        , ( "vx", E.float b.vx )
        , ( "vy", E.float b.vy )
        , ( "scale", E.float b.scale )
        ]


boardConfigDecoder : D.Decoder BoardConfig
boardConfigDecoder =
    D.succeed (\l vx vy sc -> { location = l, vx = vx, vy = vy, scale = sc })
        |> DP.required "location" sliderLocationDecoder
        |> DP.required "vx" D.float
        |> DP.required "vy" D.float
        |> DP.required "scale" D.float


encodeSliderLocation : SliderLocation -> E.Value
encodeSliderLocation l =
    case l of
        FullBoard ->
            E.object [ ( "kind", E.string "FullBoard" ) ]

        Quadrant { xHalf, yHalf } ->
            E.object
                [ ( "kind", E.string "Quadrant" )
                , ( "xHalf", encodeHalf xHalf )
                , ( "yHalf", encodeHalf yHalf )
                ]


sliderLocationDecoder : D.Decoder SliderLocation
sliderLocationDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "FullBoard" ->
                        D.succeed FullBoard

                    "Quadrant" ->
                        D.succeed (\x y -> Quadrant { xHalf = x, yHalf = y })
                            |> DP.required "xHalf" halfDecoder
                            |> DP.required "yHalf" halfDecoder

                    _ ->
                        D.fail <| "Unknown slider location kind: " ++ k
            )


encodeHalf : Half -> E.Value
encodeHalf h =
    case h of
        Lower ->
            E.string "Lower"

        Upper ->
            E.string "Upper"


halfDecoder : D.Decoder Half
halfDecoder =
    D.string
        |> D.andThen
            (\s ->
                case s of
                    "Lower" ->
                        D.succeed Lower

                    "Upper" ->
                        D.succeed Upper

                    _ ->
                        D.fail <| "Unknown Half: " ++ s
            )


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


mouseStatusDecoder : D.Decoder MouseStatus
mouseStatusDecoder =
    D.string
        |> D.andThen
            (\s ->
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
            )


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


encodePlayer : Player -> E.Value
encodePlayer p =
    case p of
        Ptt ->
            E.string "Ptt"

        Cpr ->
            E.string "Cpr"


playerDecoder : D.Decoder Player
playerDecoder =
    D.string
        |> D.andThen
            (\s ->
                case s of
                    "Ptt" ->
                        D.succeed Ptt

                    "Cpr" ->
                        D.succeed Cpr

                    _ ->
                        D.fail <| "Unknown player: " ++ s
            )


encodeOppReceiver : OppReceiver -> E.Value
encodeOppReceiver p =
    case p of
        Opp ->
            E.string "Opp"

        Slf ->
            E.string "Slf"

        Discard ->
            E.string "Discard"


oppReceiverDecoder : D.Decoder OppReceiver
oppReceiverDecoder =
    D.string
        |> D.andThen
            (\s ->
                case s of
                    "Opp" ->
                        D.succeed Opp

                    "Slf" ->
                        D.succeed Slf

                    "Discard" ->
                        D.succeed Discard

                    _ ->
                        D.fail <| "Unknown opp receiver: " ++ s
            )
