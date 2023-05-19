module Debrief exposing
    ( Model
    , Msg(..)
    , decoder
    , encode
    , encodeAnswer
    , init
    , pages
    , subs
    , update
    , view
    )

-- IMPORTS --

import Array as A
import Basics.Extra exposing (..)
import Browser.Dom as BD
import Browser.Events as BE
import Colors exposing (..)
import Css as S
import Dict as DI
import Html.Styled as H
import Html.Styled.Attributes as HA
import Html.Styled.Events as HE
import Json.Decode as D
import Json.Decode.Pipeline as DP
import Json.Encode as E
import List as L
import List.Extra as LE
import Maybe as M
import Parser as P
import Platform.Cmd as C
import Result as R
import String as ST
import SvgHelper as SH
import Task as T
import Tuple as TU
import Utils exposing (..)



-- TYPES --


type alias Model =
    { page : Int
    , qModels : List QModel
    , answers : Answers
    , mouseStatus : MouseStatus
    }


type QModel
    = QText TextModel
    | QRadio RadioModel
    | QSlider SliderModel
    | QNull


type alias Answers =
    DI.Dict String Answer



-- type Field
--     = PttToCpr
--     | CprToPtt
--     | Adjust
--     | AdjustHow
--     | NoAdjustWhy
--     | Purpose
--     | Confusing
--     | ConfusingText
--     | Technical
--     | TechnicalText


type Answer
    = AString String
    | AInt Int


type alias TextModel =
    { value : String, touched : Bool }


type alias RadioModel =
    { value : String }


type alias SliderModel =
    { value : Int
    , touched : Bool
    , bBox : BBox
    }


type MouseStatus
    = UpOut
    | UpIn Int
    | DownOut
    | DownIn Int


type Msg
    = TextInput Int String
    | TextBlur Int
    | RadioInput Int String
    | MouseEnter Int
    | MouseLeave Int
    | MouseDown Point
    | MouseUp Point
    | MouseMove Point
    | WindowResize
    | GotSlider Int (Result BD.Error BD.Element)
    | NextPage


type QConfig
    = CText TextConfig
    | CRadio RadioConfig
    | CSlider SliderConfig
    | CPlain String


type alias TextConfig =
    { field : String
    , label : String
    , show : Answers -> Bool
    }


type alias RadioConfig =
    { field : String
    , label : String
    , values : List ( String, String )
    }


type alias SliderConfig =
    { field : String
    , label : String
    , minValue : Int
    , maxValue : Int
    , tickLabels : List String
    }


type alias Page =
    { skip : Answers -> Bool
    , items : List QConfig
    }



-- MODEL --


init : Model
init =
    { page = 1
    , qModels = A.get 0 pages |> M.map .items |> M.withDefault [] |> L.map makeQModel
    , answers = DI.empty
    , mouseStatus = UpOut
    }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg m =
    case msg of
        TextInput i s ->
            ( m |> set (setQModels << LE.updateAt i << setTextModel << setTextValue) s, C.none )

        TextBlur i ->
            ( m |> set (setQModels << LE.updateAt i << setTextModel << setTextTouched) True, C.none )

        RadioInput i s ->
            ( m |> set (setQModels << LE.updateAt i << setRadioModel << setRadioValue) s, C.none )

        MouseEnter i ->
            let
                mouseStatus =
                    if m.mouseStatus == UpOut then
                        UpIn i

                    else
                        m.mouseStatus
            in
            ( { m | mouseStatus = mouseStatus }, C.none )

        MouseLeave i ->
            let
                mouseStatus =
                    if m.mouseStatus == UpIn i then
                        UpOut

                    else
                        m.mouseStatus
            in
            ( { m | mouseStatus = mouseStatus }, C.none )

        MouseDown { x } ->
            case m.mouseStatus of
                UpIn i ->
                    ( { m | qModels = updateSlider i m x, mouseStatus = DownIn i }, C.none )

                UpOut ->
                    ( { m | mouseStatus = DownOut }, C.none )

                _ ->
                    ( m, C.none )

        MouseUp { x, y } ->
            let
                isIn qModel =
                    case qModel of
                        QSlider sm ->
                            inBBox x y sm.bBox

                        _ ->
                            False

                mouseStatus =
                    LE.findIndex isIn m.qModels
                        |> M.map UpIn
                        |> M.withDefault UpOut
            in
            ( { m | mouseStatus = mouseStatus }, C.none )

        MouseMove { x } ->
            case m.mouseStatus of
                DownIn i ->
                    ( { m | qModels = updateSlider i m x }, C.none )

                _ ->
                    ( m, C.none )

        WindowResize ->
            ( m, L.indexedMap getSliderBBox m.qModels |> L.filterMap identity |> C.batch )

        GotSlider i (Ok { element }) ->
            ( m |> set (setQModels << LE.updateAt i << setSliderModel << setSliderBBox) element, C.none )

        NextPage ->
            let
                page =
                    A.get (m.page - 1) pages |> M.withDefault defaultPage

                nextPage =
                    A.get m.page pages |> M.withDefault defaultPage

                qModels =
                    L.map makeQModel nextPage.items

                newAnswers =
                    getAnswers page.items m.qModels

                allAnswers =
                    DI.union newAnswers m.answers
            in
            if m.page == A.length pages then
                ( { m | answers = allAnswers }, C.none )

            else if nextPage.skip allAnswers then
                update NextPage
                    { m
                        | page = m.page + 1
                        , answers = allAnswers
                    }

            else
                ( { m
                    | page = m.page + 1
                    , qModels = qModels
                    , answers = allAnswers
                  }
                , L.indexedMap getSliderBBox qModels
                    |> L.filterMap identity
                    |> C.batch
                )

        _ ->
            ( m, C.none )


updateSlider : Int -> Model -> Float -> List QModel
updateSlider i m x =
    let
        sliderModel =
            LE.getAt i m.qModels
                |> M.andThen getSliderModel

        sliderConfig =
            A.get (m.page - 1) pages
                |> M.andThen (.items >> LE.getAt i)
                |> M.andThen getSliderConfig

        value =
            M.map2 (\c b -> getSliderValue c b x) sliderConfig (sliderModel |> M.map .bBox)

        touched =
            case ( sliderModel, value ) of
                ( Just sm, Just v ) ->
                    Just <|
                        if sm.value /= v then
                            True

                        else
                            sm.touched

                _ ->
                    Nothing
    in
    m.qModels
        |> LE.updateAt i (maybeSet (setSliderValue >> setSliderModel) value)
        |> LE.updateAt i (maybeSet (setSliderTouched >> setSliderModel) touched)



-- VIEW --


view : Model -> H.Html Msg
view m =
    let
        items =
            A.get (m.page - 1) pages |> M.map .items |> M.withDefault []

        answers =
            DI.union (getAnswers items m.qModels) m.answers

        getQuestion i ( q, c ) =
            let
                active =
                    L.member m.mouseStatus [ UpIn i, DownIn i ]
            in
            viewQuestion active i answers c q

        questions =
            items
                |> LE.zip m.qModels
                |> L.indexedMap getQuestion
    in
    L.concat
        [ [ H.h1 [ HA.css [ S.fontSize (S.px 36) ] ] [ H.text "Post-experiment survey" ] ]
        , L.concatMap TU.first questions
        , [ H.div []
                [ H.button
                    [ HA.css [ buttonStyle, S.margin2 (S.em 1) S.zero ]
                    , HA.disabled <| L.any TU.second questions
                    , HE.onClick NextPage
                    ]
                    [ H.text "Next" ]
                ]
          ]
        ]
        |> H.div
            [ HA.css
                [ S.padding (S.em 1)
                , S.margin S.auto
                , S.minWidth (S.px 800)
                , S.maxWidth (S.px 1000)
                ]
            ]


viewQuestion : Bool -> Int -> Answers -> QConfig -> QModel -> ( List (H.Html Msg), Bool )
viewQuestion active qi a qc qm =
    case ( qc, qm ) of
        ( CText c, QText m ) ->
            let
                show =
                    c.show a
            in
            ( if show then
                L.concat
                    [ [ labelDiv c.label
                      , H.textarea
                            [ HA.css
                                [ S.width (S.pct 100)
                                , S.fontSize (S.px 18)
                                , S.height (S.em 8)
                                , S.fontFamily S.inherit
                                ]
                            , HE.onInput <| TextInput qi
                            , HE.onBlur <| TextBlur qi
                            ]
                            [ H.text m.value ]
                      ]
                    , if m.touched && m.value == "" then
                        [ H.div
                            [ HA.css [ S.color (S.hex "f00"), S.fontSize (S.px 12) ] ]
                            [ H.text "Required" ]
                        ]

                      else
                        []
                    ]

              else
                []
            , show && m.value == ""
            )

        ( CRadio c, QRadio m ) ->
            let
                getItem ( value, display ) =
                    H.div [ HA.css [ S.margin (S.em 0.5) ] ]
                        [ H.label []
                            [ H.input
                                [ HA.type_ "radio"
                                , HA.name c.field
                                , HA.value value
                                , HA.checked (m.value == value)
                                , HE.onInput <| RadioInput qi
                                ]
                                []
                            , H.span
                                [ HA.css [ S.margin (S.em 0.3), S.fontSize (S.px 20) ] ]
                                [ H.text display ]
                            ]
                        ]
            in
            ( L.concat
                [ [ labelDiv c.label ]
                , L.map getItem c.values
                ]
            , m.value == ""
            )

        ( CSlider c, QSlider m ) ->
            let
                track =
                    H.div
                        [ HA.css
                            [ S.position S.absolute
                            , S.top <| S.px <| (dThumbHeight - dTrackHeight) / 2
                            , S.left <|
                                S.calc
                                    (S.pct <| (1 - dWidthRatio) / 2 * 100)
                                    S.minus
                                    (S.px <| dTrackBorderWidth + dThumbWidth / 2)
                            , S.width <|
                                S.calc
                                    (S.pct <| dWidthRatio * 100)
                                    S.plus
                                    (S.px <| dTrackBorderWidth * 2 + dThumbWidth)
                            , S.height <| S.px dTrackHeight
                            , S.backgroundColor <| S.hex "fff"
                            , S.border3 (S.px dTrackBorderWidth) S.solid (colorToCss <| grays 0)
                            , S.borderRadius <| S.px <| dTrackHeight / 2
                            ]
                        ]
                        []

                getTickLeft i =
                    (toFloat i / toFloat (L.length c.tickLabels - 1) * dWidthRatio + (1 - dWidthRatio) / 2)
                        * 100
                        |> S.pct
                        |> S.left

                getTick i label =
                    [ H.div
                        [ HA.css
                            [ S.position S.absolute
                            , S.top <| S.px <| (dThumbHeight + dTrackHeight) / 2 + dTickSep
                            , S.transform <| S.translateX <| S.pct -50
                            , S.width <| S.px 2
                            , S.height <| S.px dTickHeight
                            , S.backgroundColor <| S.hex "7f7f7f"
                            , getTickLeft i
                            ]
                        ]
                        []
                    , H.div
                        [ HA.css
                            [ S.position S.absolute
                            , S.property "width" "max-content"
                            , S.top <| S.px <| (dThumbHeight + dTrackHeight) / 2 + dTickSep + dTickHeight
                            , S.transform <| S.translateX <| S.pct -50
                            , S.fontSize <| S.px 18
                            , S.cursor S.default
                            , S.property "user-select" "none"
                            , getTickLeft i
                            ]
                        ]
                        [ H.text label ]
                    ]

                thumbBg =
                    if active then
                        "e0e0e0"

                    else
                        "fff"

                thumb =
                    H.div
                        [ HA.css
                            [ S.position S.absolute
                            , S.transform <| S.translateX <| S.pct -50
                            , S.width <| S.px dThumbWidth
                            , S.height <| S.px dThumbHeight
                            , S.border3 (S.px dThumbBorderWidth) S.solid (colorToCss <| grays 0)
                            , S.borderRadius <| S.px dThumbRadius
                            , S.left <|
                                S.pct <|
                                    (toFloat (m.value - c.minValue)
                                        / toFloat (c.maxValue - c.minValue)
                                        * dWidthRatio
                                        + (1 - dWidthRatio)
                                        / 2
                                    )
                                        * 100
                            , S.backgroundColor <| S.hex thumbBg
                            ]
                        ]
                        []
            in
            ( [ labelDiv c.label
              , H.div
                    [ HA.css
                        [ S.position S.relative
                        , S.width (S.pct 100)
                        , S.height (S.px 90)
                        ]
                    , HA.id <| sliderId qi
                    , HE.onMouseEnter <| MouseEnter qi
                    , HE.onMouseLeave <| MouseLeave qi
                    ]
                <|
                    L.concat
                        [ [ track ]
                        , L.indexedMap getTick c.tickLabels |> L.concat
                        , [ thumb ]
                        ]
              ]
            , not m.touched
            )

        ( CPlain s, QNull ) ->
            ( [ labelDiv s ], False )

        _ ->
            ( [], False )



-- SUBSCRIPTIONS --


subs : Model -> Sub Msg
subs m =
    let
        mouseDownUp =
            if L.any isSlider m.qModels then
                Sub.batch
                    [ BE.onMouseDown (D.map2 (pointThen MouseDown) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    , BE.onMouseUp (D.map2 (pointThen MouseUp) (D.field "pageX" D.float) (D.field "pageY" D.float))
                    ]

            else
                Sub.none

        mouseMove =
            case m.mouseStatus of
                DownIn _ ->
                    BE.onMouseMove (D.map2 (pointThen MouseMove) (D.field "pageX" D.float) (D.field "pageY" D.float))

                _ ->
                    Sub.none
    in
    Sub.batch
        [ mouseDownUp
        , mouseMove
        , BE.onResize (\_ _ -> WindowResize)
        ]



-- CONSTANTS --


defaultPage : Page
defaultPage =
    { skip = always False
    , items = []
    }


noSkipPage : List QConfig -> Page
noSkipPage l =
    { skip = always False, items = l }


pages : A.Array Page
pages =
    let
        skipBelieve a =
            let
                begin =
                    DI.get "believeBegin" a |> M.andThen getAInt |> M.withDefault 8

                end =
                    DI.get "believeEnd" a |> M.andThen getAInt |> M.withDefault 8
            in
            begin > 0 && end > 0
    in
    A.fromList
        [ noSkipPage
            [ CPlain "Please answer a few questions about your experience in the experiment."
            , CPlain "(Click Next)"
            ]
        , noSkipPage
            [ CSlider
                { field = "pttToCpr"
                , label = "In general, how nice (or mean) were you towards the other participant? (Use the slider to answer)"
                , minValue = -8
                , maxValue = 8
                , tickLabels = [ "Extremely mean", "Moderately mean", "Neutral", "Moderately nice", "Extremely nice" ]
                }
            ]
        , noSkipPage
            [ CSlider
                { field = "cprToPtt"
                , label = "In general, how nice (or mean) do you think was the other participant towards you? (Use the slider to answer)"
                , minValue = -8
                , maxValue = 8
                , tickLabels = [ "Extremely mean", "Moderately mean", "Neutral", "Moderately nice", "Extremely nice" ]
                }
            ]
        , noSkipPage
            [ CRadio
                { field = "adjust"
                , label = "Did you adjust your niceness (or meanness) towards the other participant according to how nice (or mean) they were towards you?"
                , values = [ ( "n", "Not at all" ), ( "y", "Yes, to some extent" ) ]
                }
            , CText
                { field = "adjustHow"
                , label = "How did you adjust?"
                , show = \a -> DI.get "adjust" a == Just (AString "y")
                }
            , CText
                { field = "noAdjustWhy"
                , label = "Why not?"
                , show = \a -> DI.get "adjust" a == Just (AString "n")
                }
            ]
        , noSkipPage
            [ CSlider
                { field = "believeBegin"
                , label = "In fact, the [cpr|blue] player was a computer agent who pretended to be a human (we apologize for lying to you, but it was necessary for the experiment!). How much did you believe that the [cpr|blue] player was a real human at the beginning of the real games?"
                , minValue = -8
                , maxValue = 8
                , tickLabels = [ "Not at all", "Slightly", "Moderately", "Very much", "Absolutely" ]
                }
            , CSlider
                { field = "believeEnd"
                , label = "How much did you believe that the [cpr|blue] player was a real human near the end of the real games?"
                , minValue = -8
                , maxValue = 8
                , tickLabels = [ "Not at all", "Slightly", "Moderately", "Very much", "Absolutely" ]
                }
            ]
        , { skip = skipBelieve
          , items =
                [ CText
                    { field = "whyNotBelieve"
                    , label = "What made you suspicious that the [cpr|blue] player wasn’t a real human?"
                    , show = always True
                    }
                ]
          }
        , noSkipPage
            [ CRadio
                { field = "confusing"
                , label = "Did you find any part of the experiment confusing?"
                , values = [ ( "y", "Yes" ), ( "n", "No" ) ]
                }
            , CText
                { field = "confusingText"
                , label = "Please describe:"
                , show = \a -> DI.get "confusing" a == Just (AString "y")
                }
            ]
        , noSkipPage
            [ CRadio
                { field = "technical"
                , label = "Did you encounter any technical problems?"
                , values = [ ( "y", "Yes" ), ( "n", "No" ) ]
                }
            , CText
                { field = "technicalText"
                , label = "Please describe:"
                , show = \a -> DI.get "technical" a == Just (AString "y")
                }
            ]
        ]


dWidthRatio : Float
dWidthRatio =
    0.8


dTrackHeight : Float
dTrackHeight =
    16


dTrackBorderWidth : Float
dTrackBorderWidth =
    2


dThumbHeight : Float
dThumbHeight =
    48


dThumbWidth : Float
dThumbWidth =
    32


dThumbBorderWidth : Float
dThumbBorderWidth =
    4


dThumbRadius : Float
dThumbRadius =
    dTrackHeight / 2


dTickHeight : Float
dTickHeight =
    16


dTickSep : Float
dTickSep =
    8



-- allFields : List Field
-- allFields =
--     [ PttToCpr
--     , CprToPtt
--     , Adjust
--     , AdjustHow
--     , NoAdjustWhy
--     , Purpose
--     , Confusing
--     , ConfusingText
--     , Technical
--     , TechnicalText
--     ]
-- HELPER FUNCTIONS --


setQModels : Setter Model (List QModel)
setQModels f m =
    { m | qModels = f m.qModels }


setTextModel : Setter QModel TextModel
setTextModel f m =
    case m of
        QText t ->
            QText <| f t

        _ ->
            m


setRadioModel : Setter QModel RadioModel
setRadioModel f m =
    case m of
        QRadio t ->
            QRadio <| f t

        _ ->
            m


setSliderModel : Setter QModel SliderModel
setSliderModel f m =
    case m of
        QSlider t ->
            QSlider <| f t

        _ ->
            m


setTextValue : Setter TextModel String
setTextValue f m =
    { m | value = f m.value }


setTextTouched : Setter TextModel Bool
setTextTouched f m =
    { m | touched = f m.touched }


setRadioValue : Setter RadioModel String
setRadioValue f m =
    { m | value = f m.value }


setSliderValue : Setter SliderModel Int
setSliderValue f m =
    { m | value = f m.value }


setSliderTouched : Setter SliderModel Bool
setSliderTouched f m =
    { m | touched = f m.touched }


setSliderBBox : Setter SliderModel BBox
setSliderBBox f m =
    { m | bBox = f m.bBox }



-- fieldToString : Field -> String
-- fieldToString f =
--     case f of
--         PttToCpr ->
--             "PttToCpr"
--         CprToPtt ->
--             "CprToPtt"
--         Adjust ->
--             "Adjust"
--         AdjustHow ->
--             "AdjustHow"
--         NoAdjustWhy ->
--             "NoAdjustWhy"
--         Purpose ->
--             "Purpose"
--         Confusing ->
--             "Confusing"
--         ConfusingText ->
--             "ConfusingText"
--         Technical ->
--             "Technical"
--         TechnicalText ->
--             "TechnicalText"


labelDiv : String -> H.Html msg
labelDiv s =
    let
        fragments =
            P.run SH.textParser s |> R.withDefault []
    in
    H.div
        [ HA.css
            [ S.margin2 (S.em 0.5) S.zero
            , S.fontSize (S.px 24)
            ]
        ]
    <|
        L.map drawFragment fragments


drawFragment : SH.Fragment -> H.Html msg
drawFragment f =
    case f of
        SH.Plain t ->
            H.text t

        SH.Span { styles, text } ->
            H.span [ HA.css << flattenMaybe <| L.map (\s -> DI.get s stylesDict) styles ] [ H.text text ]


stylesDict : SH.StylesDict
stylesDict =
    DI.union SH.baseStylesDict <| DI.map (\_ c -> S.color <| colorToCss c) colorsDict


sliderId : Int -> String
sliderId i =
    "slider-" ++ ST.fromInt i


getSliderBBox : Int -> QModel -> Maybe (Cmd Msg)
getSliderBBox i qModel =
    case qModel of
        QSlider _ ->
            sliderId i
                |> BD.getElement
                |> T.attempt (GotSlider i)
                |> Just

        _ ->
            Nothing


isSlider : QModel -> Bool
isSlider m =
    case m of
        QSlider _ ->
            True

        _ ->
            False


getSliderModel : QModel -> Maybe SliderModel
getSliderModel m =
    case m of
        QSlider s ->
            Just s

        _ ->
            Nothing


getSliderConfig : QConfig -> Maybe SliderConfig
getSliderConfig c =
    case c of
        CSlider s ->
            Just s

        _ ->
            M.Nothing


getSliderValue : SliderConfig -> BBox -> Float -> Int
getSliderValue c b x =
    let
        minX =
            b.x + (1 - dWidthRatio) / 2 * b.width

        maxX =
            b.x + (1 + dWidthRatio) / 2 * b.width

        rawValue =
            round <| toFloat c.minValue + (x - minX) / (maxX - minX) * (toFloat c.maxValue - toFloat c.minValue)
    in
    clamp c.minValue c.maxValue rawValue


makeQModel : QConfig -> QModel
makeQModel c =
    case c of
        CText _ ->
            QText { value = "", touched = False }

        CRadio _ ->
            QRadio { value = "" }

        CSlider _ ->
            QSlider { value = 0, touched = False, bBox = { x = 0, y = 0, width = 0, height = 0 } }

        CPlain _ ->
            QNull


getAnswer : QConfig -> QModel -> Maybe ( String, Answer )
getAnswer qc qm =
    case ( qc, qm ) of
        ( CText c, QText m ) ->
            if m.value == "" then
                Nothing

            else
                Just ( c.field, AString m.value )

        ( CRadio c, QRadio m ) ->
            Just ( c.field, AString m.value )

        ( CSlider c, QSlider m ) ->
            Just ( c.field, AInt m.value )

        _ ->
            Nothing


getAnswers : List QConfig -> List QModel -> Answers
getAnswers items qModels =
    LE.zip items qModels
        |> L.filterMap (uncurry getAnswer)
        |> DI.fromList


getAInt : Answer -> Maybe Int
getAInt a =
    case a of
        AInt i ->
            Just i

        _ ->
            Nothing



-- JSON --


encode : Model -> E.Value
encode m =
    E.object
        [ ( "page", E.int m.page )
        , ( "qModels", E.list encodeQModel m.qModels )
        , ( "answers", E.dict identity encodeAnswer m.answers )
        , ( "mouseStatus", encodeMouseStatus m.mouseStatus )
        ]


decoder : D.Decoder Model
decoder =
    D.succeed
        (\p q a m ->
            { page = p
            , qModels = q
            , answers = a
            , mouseStatus = m
            }
        )
        |> DP.required "page" D.int
        |> DP.required "qModels" (D.list qModelDecoder)
        |> DP.required "answers" (D.dict answerDecoder)
        |> DP.required "mouseStatus" mouseStatusDecoder


encodeQModel : QModel -> E.Value
encodeQModel qm =
    case qm of
        QText m ->
            E.object
                [ ( "kind", E.string "QText" )
                , ( "value", E.string m.value )
                , ( "touched", E.bool m.touched )
                ]

        QRadio m ->
            E.object
                [ ( "kind", E.string "QRadio" )
                , ( "value", E.string m.value )
                ]

        QSlider m ->
            E.object
                [ ( "kind", E.string "QSlider" )
                , ( "value", E.int m.value )
                , ( "touched", E.bool m.touched )
                , ( "bBox", encodeBBox m.bBox )
                ]

        QNull ->
            E.object
                [ ( "kind", E.string "QNull" ) ]


qModelDecoder : D.Decoder QModel
qModelDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "QText" ->
                        D.succeed (\v t -> QText { value = v, touched = t })
                            |> DP.required "value" D.string
                            |> DP.required "touched" D.bool

                    "QRadio" ->
                        D.succeed (\v -> QRadio { value = v })
                            |> DP.required "value" D.string

                    "QSlider" ->
                        D.succeed (\v t b -> QSlider { value = v, touched = t, bBox = b })
                            |> DP.required "value" D.int
                            |> DP.required "touched" D.bool
                            |> DP.required "bBox" bBoxDecoder

                    "QNull" ->
                        D.succeed QNull

                    _ ->
                        D.fail <| "Unknown qModel kind: " ++ k
            )


encodeAnswer : Answer -> E.Value
encodeAnswer qm =
    case qm of
        AString s ->
            E.string s

        AInt i ->
            E.int i


answerDecoder : D.Decoder Answer
answerDecoder =
    D.oneOf
        [ D.int |> D.map AInt
        , D.string |> D.map AString
        ]


encodeMouseStatus : MouseStatus -> E.Value
encodeMouseStatus m =
    case m of
        UpOut ->
            E.object [ ( "kind", E.string "UpOut" ) ]

        UpIn i ->
            E.object
                [ ( "kind", E.string "UpOut" )
                , ( "i", E.int i )
                ]

        DownOut ->
            E.object [ ( "kind", E.string "DownOut" ) ]

        DownIn i ->
            E.object
                [ ( "kind", E.string "DownIn" )
                , ( "i", E.int i )
                ]


mouseStatusDecoder : D.Decoder MouseStatus
mouseStatusDecoder =
    D.field "kind" D.string
        |> D.andThen
            (\k ->
                case k of
                    "UpOut" ->
                        D.succeed UpOut

                    "UpIn" ->
                        D.succeed (\i -> UpIn i)
                            |> DP.required "i" D.int

                    "DownOut" ->
                        D.succeed DownOut

                    "DownIn" ->
                        D.succeed (\i -> DownIn i)
                            |> DP.required "i" D.int

                    _ ->
                        D.fail <| "Unknown mouse status kind: " ++ k
            )
