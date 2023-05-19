port module Main exposing (main)

-- IMPORTS --

import Array as A
import Basics.Extra exposing (..)
import Browser as B
import Browser.Navigation as BN
import Char
import Colors exposing (..)
import Css as S
import Css.ModernNormalize as CM
import Debrief as DB
import Dict as DI
import Html as H
import Html.Events as HE
import Html.Styled as HS
import Html.Styled.Attributes as HA
import Html.Styled.Events as HSE
import Http as HP
import Json.Decode as D
import Json.Decode.Pipeline as DP
import Json.Encode as E
import List as L
import Maybe as M
import Platform.Cmd as C
import Random as R
import Random.Extra as RE
import Random.String as RS
import String as ST
import SvgHelper exposing (..)
import TtrlTest as TT
import Url as U
import Url.Parser as UP
import Url.Parser.Query as UQ
import Utils exposing (..)



-- TYPES --
-- ptt: participant
-- cpr: computer
-- slf: self
-- opp: opponent
-- ttrl: tutorial


type ExptStage
    = ESConsent
    | ESTtrl
    | ESTest
    | ESReal
    | ESDebrief
    | ESFinal


type alias Flags =
    ()


type alias Model =
    { client : Client
    , expt : ExptModel
    , testData : List TT.RoundData
    , debug : Bool
    , waitSpeedRatio : Float
    , nPrtcRounds : Int
    , nRealRounds : Int
    , failCount : Int
    }


type Client
    = Visitor String
    | Prolific
        { prolificPid : String
        , studyId : String
        , sessionId : String
        , completionCode : String
        }


type ExptModel
    = Consent
    | Ttrl TT.TtrlModel
    | Test TT.TestModel
    | Debrief DB.Model
    | Final


type Msg
    = NoOp
    | GotRandomCode String
    | SaveState
    | LoadState
    | StateLoaded (Result D.Error Model)
    | Consented
    | Uploaded (Result HP.Error ())
    | Finish
    | TTMsg TT.Msg
    | DBMsg DB.Msg


type alias UrlConfig =
    { initStage : ExptStage
    , debug : Bool
    , waitSpeedRatio : Float
    , nPrtcRounds : Int
    , nRealRounds : Int
    , prolificPid : String
    , studyId : String
    , sessionId : String
    }



-- PORTS --


port saveState : E.Value -> Cmd msg


port loadState : () -> Cmd msg


port stateLoaded : (E.Value -> msg) -> Sub msg


port alert : String -> Cmd msg



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
init _ u _ =
    let
        uc =
            UP.parse urlParser { u | path = "/" }
                |> M.withDefault defaultUrlConfig

        ( client, c1 ) =
            if uc.prolificPid == "" then
                ( Visitor "", R.generate GotRandomCode <| RS.string 8 charGen )

            else
                ( Prolific
                    { prolificPid = uc.prolificPid
                    , studyId = uc.studyId
                    , sessionId = uc.sessionId
                    , completionCode = ""
                    }
                , R.generate GotRandomCode <| RS.string 8 charGen
                )

        ttProps =
            { debug = uc.debug
            , waitSpeedRatio = uc.waitSpeedRatio
            , nPrtcRounds = uc.nPrtcRounds
            , nRealRounds = uc.nRealRounds
            }

        ( expt, c2 ) =
            case uc.initStage of
                ESConsent ->
                    ( Consent, C.none )

                ESTtrl ->
                    ( Ttrl TT.initTtrl, C.map TTMsg TT.initTtrlCmd )

                ESTest ->
                    ( Test TT.initTest, C.map TTMsg <| TT.initTestCmd ttProps )

                ESReal ->
                    ( Test TT.initReal, C.map TTMsg <| TT.initRealCmd ttProps )

                ESDebrief ->
                    ( Debrief DB.init, C.none )

                ESFinal ->
                    ( Final, C.none )
    in
    ( { client = client
      , expt = expt
      , testData = []
      , debug = uc.debug
      , waitSpeedRatio = uc.waitSpeedRatio
      , nPrtcRounds = uc.nPrtcRounds
      , nRealRounds = uc.nRealRounds
      , failCount = 0
      }
    , C.batch [ c1, c2 ]
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg =
    let
        u1 m =
            case msg of
                GotRandomCode c ->
                    let
                        client =
                            case m.client of
                                Visitor _ ->
                                    Visitor c

                                Prolific p ->
                                    Prolific { p | completionCode = c }
                    in
                    ( { m | client = client }, C.none )

                StateLoaded (Ok m2) ->
                    ( m2, C.none )

                SaveState ->
                    ( m, saveState <| encode m )

                LoadState ->
                    ( m, loadState () )

                Consented ->
                    ( { m | expt = Ttrl TT.initTtrl }, C.map TTMsg TT.initTtrlCmd )

                Uploaded (Ok _) ->
                    ( { m | expt = Final }, C.none )

                Uploaded (Err _) ->
                    if m.failCount <= 0 then
                        ( { m | failCount = m.failCount + 1 }
                        , alert "Network error. Please check your connection or try again later."
                        )

                    else
                        ( { m | expt = Final }, C.none )

                Finish ->
                    let
                        url =
                            case m.client of
                                Visitor _ ->
                                    "https://socallab.ucsd.edu/"

                                Prolific p ->
                                    "https://app.prolific.co/submissions/complete?cc=" ++ p.completionCode
                    in
                    ( m, BN.load url )

                TTMsg (TT.NextStep _) ->
                    case m.expt of
                        Ttrl t ->
                            if t.step == A.length TT.ttrlSteps then
                                ( set setExpt (Test TT.initTest) m
                                , C.map TTMsg <| TT.initTestCmd (getTtProps m)
                                )

                            else
                                ( m, C.none )

                        _ ->
                            ( m, C.none )

                TTMsg (TT.TestGoTo TT.PrePrtc) ->
                    case m.expt of
                        Test t ->
                            ( { m
                                | expt = Debrief DB.init
                                , testData = L.reverse t.history
                              }
                            , C.none
                            )

                        _ ->
                            ( m, C.none )

                _ ->
                    ( m, C.none )

        u2 m =
            case msg of
                TTMsg ttmsg ->
                    case m.expt of
                        Ttrl ttrl ->
                            let
                                ( ttrl1, c1 ) =
                                    TT.updateTtrl identity ttmsg (getTtProps m) ttrl
                            in
                            ( set setExpt (Ttrl ttrl1) m, C.map TTMsg c1 )

                        Test test ->
                            let
                                ( test1, c1 ) =
                                    TT.updateTest ttmsg (getTtProps m) test
                            in
                            ( set setExpt (Test test1) m, C.map TTMsg c1 )

                        _ ->
                            ( m, C.none )

                DBMsg dbmsg ->
                    case m.expt of
                        Debrief debrief ->
                            let
                                ( debrief1, c1 ) =
                                    DB.update dbmsg debrief

                                c2 =
                                    if dbmsg == DB.NextPage && debrief.page == A.length DB.pages then
                                        HP.post
                                            { url = "submit.simple.php"
                                            , body = HP.jsonBody (encodeData m)
                                            , expect = HP.expectWhatever Uploaded
                                            }

                                    else
                                        C.none
                            in
                            ( set setExpt (Debrief debrief1) m, C.batch [ C.map DBMsg c1, c2 ] )

                        _ ->
                            ( m, C.none )

                _ ->
                    ( m, C.none )
    in
    chainUpdates [ u1, u2 ]



-- VIEW --


view : Model -> B.Document Msg
view m =
    { title = "Experiment on games"
    , body =
        let
            div =
                case m.expt of
                    Consent ->
                        viewConsent

                    Ttrl t ->
                        TT.viewTtrl t |> TT.svgToHtml |> HS.map TTMsg

                    Test t ->
                        TT.viewTest (getTtProps m) t |> TT.svgToHtml |> HS.map TTMsg

                    Debrief d ->
                        DB.view d |> HS.map DBMsg

                    Final ->
                        viewFinal
        in
        L.concat
            [ [ CM.globalHtml ]
            , if m.debug then
                [ H.div []
                    [ H.button [ HE.onClick SaveState ] [ H.text "Save state" ]
                    , H.button [ HE.onClick LoadState ] [ H.text "Load state" ]
                    ]
                ]

              else
                []
            , [ HS.toUnstyled div ]
            ]
    }


viewConsent : HS.Html Msg
viewConsent =
    HS.div
        [ HA.css
            [ S.margin2 (S.em 1) (S.pct 15)
            , S.lineHeight (S.num 1.3)
            ]
        ]
        [ h1 "University of California, San Diego"
        , h1 "Consent to Act as a Research Subject"
        , h2 "Adults’ understanding of their social and physical worlds"
        , HS.p [ HA.css [ S.fontWeight S.bold, S.fontSize (S.px 20) ] ] [ HS.text "IMPORTANT: You must use a desktop/laptop computer with a mouse/trackpad to complete the experiment." ]
        , HS.dl []
            [ dt "Who is conducting the study?"
            , dd "Prof. Lindsey Powell is conducting research to find out more about adult cognition and decision making. You have been asked to participate in this study because you are within the age range of interest for the current study."
            , dt "Why is this study being done?"
            , dd "The purpose of this study is to understand how adults think about everyday interactions with objects and other people."
            , dt "What will happen to you in this study and which procedures are standard of care and which are experimental?"
            , dd "If you agree to be in this study, here is what may be asked of you:"
            , dd "To read short stories or watch short videos or animations depicting events and answer questions about them; to make decisions either independently or in a social setting; to talk with a researcher or other participant about everyday topics; to answer simple demographic questions and questions about relevant behaviors."
            , dt "How much time will each study procedure take, what is your total time commitment, and how long will the study last?"
            , dd "Your participation will involve just one session, likely lasting between 10 and 60 minutes."
            , dt "What risks are associated with this study?"
            , dd "Participation in this study may involve minor risks or discomforts. These include the following:"
            , HS.ol [ HA.css [ S.paddingLeft (S.em 3), marginV 0.5 ] ]
                [ li "A potential for the loss of confidentiality. We minimize this risk by storing electronic records on encrypted, password-protected departmental servers and lab devices; by storing physical records in locked laboratory spaces; by only allowing access to those devices and spaces to lab personnel; and by identifying participants by ID codes rather than names in all data summaries."
                , li "Most participants find the experience enjoyable, but there is a very small risk that you will experience negative emotions, such as boredom. This risk will be no greater than within the context of normal adult interactions, and we attempt to minimize it by keeping the study short and fun."
                ]
            , dd "Because this is a research study, there may also be some unknown risks that are currently unforeseeable. You will be informed of any significant new findings."
            , dt "What are the alternatives to participating in this study?"
            , dd "The alternative to participation is to not participate."
            , dt "What benefits can be reasonably expected?"
            , dd "There may or may not be any direct benefit to you from participating in this study. Adults may enjoy gaining insight into how researchers study adults’ thinking and reasoning. The investigator may learn more about human cognition, and society may benefit from this knowledge."
            , dt "Can you choose to not participate or withdraw from the study without penalty or loss of benefits?"
            , dd "Participation in research is entirely voluntary. If you decide that you no longer wish to continue in this study, you can simply close this web page."
            , dt "Can you be withdrawn from the study without your consent?"
            , dd "The PI may remove you from the study without your consent if the PI feels it is in your best interest or the best interest of the study. Your may also be withdrawn from the study if you do not follow the instructions given to you."
            , dt "Will you be compensated for participating in this study?"
            , dd "In compensation for your time, you will be paid through Prolific (value determined at a rate of $15/hour, and based on the average time to complete the study)."
            , dt "Are there any costs associated with participating in this study?"
            , dd "There will be no cost to you for participating in this study."
            , dt "What if you are injured as a direct result of being in this study?"
            , dd "This study poses no risk of injury to you."
            , dt "Who can you call if you have questions?"
            , dd "You may reach Prof. Lindsey Powell at ljpowell@ucsd.edu. You may also call the Human Research Protections Program Office at 858-246-HRPP (858-246-4777) to inquire about your rights as a research subject or to report research-related problems."
            , dt "How can you obtain a copy of this consent document?"
            , dd "You can print this web page."
            ]
        , HS.div [ HA.css [ S.textAlign S.center ] ]
            [ HS.button [ HA.css [ buttonStyle ], HSE.onClick Consented ]
                [ HS.text "Click here to consent and agree to participate" ]
            ]
        ]


h1 : String -> HS.Html Msg
h1 s =
    HS.h1
        [ HA.css
            [ S.fontSize (S.px 24)
            , S.textAlign S.center
            , marginV 0
            ]
        ]
        [ HS.text s ]


h2 : String -> HS.Html Msg
h2 s =
    HS.h2
        [ HA.css
            [ S.fontSize (S.px 22)
            , S.textAlign S.center
            , marginV 0.5
            ]
        ]
        [ HS.text s ]


dt : String -> HS.Html Msg
dt s =
    HS.dt
        [ HA.css
            [ S.fontSize (S.px 18)
            , S.fontWeight S.bold
            , S.marginTop (S.em 0.5)
            ]
        ]
        [ HS.text s ]


dd : String -> HS.Html Msg
dd s =
    HS.dd
        [ HA.css
            [ S.fontSize (S.px 18)
            , marginV 0.3
            , S.marginLeft (S.em 1)
            ]
        ]
        [ HS.text s ]


li : String -> HS.Html Msg
li s =
    HS.li
        [ HA.css
            [ S.fontSize (S.px 18)
            , marginV 0.3
            ]
        ]
        [ HS.text s ]


marginV : Float -> S.Style
marginV m =
    S.batch [ S.marginTop (S.em m), S.marginBottom (S.em m) ]


viewFinal : HS.Html Msg
viewFinal =
    HS.div [ HA.css [ S.textAlign S.center ] ]
        [ HS.h1 [] [ HS.text "Thanks for your participation!" ]
        , HS.p [ HA.css [ S.fontSize (S.px 20) ] ] [ HS.text "(You have to click the Finish button to get credit!)" ]
        , HS.button [ HA.css [ buttonStyle ], HSE.onClick Finish ] [ HS.text "Finish" ]
        ]



-- SUBSCRIPTIONS --


subscriptions : Model -> Sub Msg
subscriptions m =
    let
        subs =
            case m.expt of
                Consent ->
                    Sub.none

                Ttrl t ->
                    TT.subsTtrl identity True True (getTtProps m) t |> Sub.map TTMsg

                Test t ->
                    TT.subsTest (getTtProps m) t |> Sub.map TTMsg

                Debrief d ->
                    DB.subs d |> Sub.map DBMsg

                Final ->
                    Sub.none
    in
    Sub.batch
        [ stateLoaded (StateLoaded << D.decodeValue decoder)
        , subs
        ]



-- CONSTANTS --


defaultUrlConfig : UrlConfig
defaultUrlConfig =
    { initStage = ESConsent
    , debug = False
    , waitSpeedRatio = 1
    , nPrtcRounds = 6
    , nRealRounds = 20
    , prolificPid = ""
    , studyId = ""
    , sessionId = ""
    }


charSet : List Char
charSet =
    L.range 48 57 ++ L.range 97 122 |> L.map Char.fromCode


charGen : R.Generator Char
charGen =
    RE.sample charSet |> R.map (M.withDefault '0')



-- HELPER FUNCTIONS --


setExpt : Setter Model ExptModel
setExpt f m =
    { m | expt = f m.expt }


urlParser : UP.Parser (UrlConfig -> a) a
urlParser =
    succeed
        (\i d w p r pp st se ->
            { initStage = i
            , debug = d
            , waitSpeedRatio = w
            , nPrtcRounds = p
            , nRealRounds = r
            , prolificPid = pp
            , studyId = st
            , sessionId = se
            }
        )
        |> apply
            (UQ.enum "initstage"
                (DI.fromList
                    [ ( "consent", ESConsent )
                    , ( "test", ESTest )
                    , ( "test", ESTest )
                    , ( "real", ESReal )
                    , ( "debrief", ESDebrief )
                    , ( "final", ESFinal )
                    ]
                )
                |> UQ.map (M.withDefault defaultUrlConfig.initStage)
            )
        |> apply
            (UQ.enum "debug"
                (DI.fromList
                    [ ( "true", True )
                    , ( "false", False )
                    ]
                )
                |> UQ.map (M.withDefault defaultUrlConfig.debug)
            )
        |> apply (UQ.custom "speedratio" (L.head >> M.andThen ST.toFloat >> M.withDefault defaultUrlConfig.waitSpeedRatio))
        |> apply (UQ.int "nprtcrounds" |> qDefault defaultUrlConfig.nPrtcRounds)
        |> apply (UQ.int "nrealrounds" |> qDefault defaultUrlConfig.nRealRounds)
        |> apply (UQ.string "prolificPid" |> qDefault defaultUrlConfig.prolificPid)
        |> apply (UQ.string "studyId" |> qDefault defaultUrlConfig.studyId)
        |> apply (UQ.string "sessionId" |> qDefault defaultUrlConfig.sessionId)
        |> UP.query


apply : UQ.Parser a -> UQ.Parser (a -> b) -> UQ.Parser b
apply argParser funcParser =
    UQ.map2 (<|) funcParser argParser


succeed : a -> UQ.Parser a
succeed a =
    UQ.custom "" (always a)


qDefault : a -> UQ.Parser (Maybe a) -> UQ.Parser a
qDefault =
    UQ.map << M.withDefault


getTtProps : Model -> TT.Props
getTtProps m =
    { debug = m.debug
    , waitSpeedRatio = m.waitSpeedRatio
    , nPrtcRounds = m.nPrtcRounds
    , nRealRounds = m.nRealRounds
    }



-- JSON --


encode : Model -> E.Value
encode m =
    E.object
        [ ( "client", encodeClient m.client )
        , ( "expt", encodeExpt m.expt )
        , ( "testData", E.list TT.encodeRoundData m.testData )
        , ( "debug", E.bool m.debug )
        , ( "waitSpeedRatio", E.float m.waitSpeedRatio )
        , ( "nPrtcRounds", E.int m.nPrtcRounds )
        , ( "nRealRounds", E.int m.nRealRounds )
        , ( "failCount", E.int m.failCount )
        ]


decoder : D.Decoder Model
decoder =
    D.succeed
        (\c e t d w np nr f ->
            { client = c
            , expt = e
            , testData = t
            , debug = d
            , waitSpeedRatio = w
            , nPrtcRounds = np
            , nRealRounds = nr
            , failCount = f
            }
        )
        |> DP.required "client" clientDecoder
        |> DP.required "expt" exptDecoder
        |> DP.required "testData" (D.list TT.roundDataDecoder)
        |> DP.required "debug" D.bool
        |> DP.required "waitSpeedRatio" D.float
        |> DP.required "nPrtcRounds" D.int
        |> DP.required "nRealRounds" D.int
        |> DP.required "failCount" D.int


encodeClient : Client -> E.Value
encodeClient c =
    case c of
        Visitor v ->
            E.object
                [ ( "kind", E.string "Visitor" )
                , ( "id", E.string v )
                ]

        Prolific p ->
            E.object
                [ ( "kind", E.string "Prolific" )
                , ( "prolificPid", E.string p.prolificPid )
                , ( "studyId", E.string p.studyId )
                , ( "sessionId", E.string p.sessionId )
                , ( "completionCode", E.string p.completionCode )
                ]


clientDecoder : D.Decoder Client
clientDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "Visitor" ->
                        D.succeed (\i -> Visitor i)
                            |> DP.required "id" D.string

                    "Prolific" ->
                        D.succeed
                            (\p st se c ->
                                Prolific
                                    { prolificPid = p
                                    , studyId = st
                                    , sessionId = se
                                    , completionCode = c
                                    }
                            )
                            |> DP.required "prolificPid" D.string
                            |> DP.required "studyId" D.string
                            |> DP.required "sessionId" D.string
                            |> DP.required "completionCode" D.string

                    _ ->
                        D.fail <| "Unknown kind: " ++ k
            )


encodeExpt : ExptModel -> E.Value
encodeExpt m =
    case m of
        Consent ->
            E.object
                [ ( "kind", E.string "Consent" ) ]

        Ttrl t ->
            E.object
                [ ( "kind", E.string "Ttrl" )
                , ( "state", TT.encodeTtrl t )
                ]

        Test t ->
            E.object
                [ ( "kind", E.string "Test" )
                , ( "state", TT.encodeTest t )
                ]

        Debrief d ->
            E.object
                [ ( "kind", E.string "Debrief" )
                , ( "state", DB.encode d )
                ]

        Final ->
            E.object
                [ ( "kind", E.string "Final" ) ]


exptDecoder : D.Decoder ExptModel
exptDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "Ttrl" ->
                        D.map Ttrl <| D.field "state" TT.ttrlDecoder

                    "Test" ->
                        D.map Test <| D.field "state" TT.testDecoder

                    "Debrief" ->
                        D.map Debrief <| D.field "state" DB.decoder

                    _ ->
                        D.fail <| "Unknown kind: " ++ k
            )


encodeData : Model -> E.Value
encodeData m =
    case m.expt of
        Debrief d ->
            E.object
                [ ( "client", encodeClientData m.client )
                , ( "testData", E.list TT.encodeRoundData m.testData )
                , ( "debrief", E.dict identity DB.encodeAnswer d.answers )
                ]

        _ ->
            E.null


encodeClientData : Client -> E.Value
encodeClientData c =
    case c of
        Visitor v ->
            E.object
                [ ( "workerId", E.string <| "visitor-" ++ v )
                ]

        Prolific p ->
            E.object
                [ ( "workerId", E.string <| "prolific-" ++ p.prolificPid )
                , ( "studyId", E.string p.studyId )
                , ( "sessionId", E.string p.sessionId )
                , ( "completionCode", E.string p.completionCode )
                ]



-- END --
