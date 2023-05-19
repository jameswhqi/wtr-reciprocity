module SvgHelper exposing
    ( Anchor
    , Element(..)
    , Fragment(..)
    , PointerEvents(..)
    , QBezierConfig
    , Shape(..)
    , StylesDict
    , TextAnchor(..)
    , activeFill
    , baseStylesDict
    , check
    , circle
    , complexCH
    , complexCW
    , draw
    , fill
    , getAnchorPos
    , getTextAnchorPos
    , hide
    , hoverFill
    , id
    , line
    , mapElement
    , onClick
    , onLayer
    , onMouseEnter
    , onMouseLeave
    , oppositeAnchor
    , oppositeTextAnchor
    , pointerEvents
    , qBezier
    , rRect
    , rRectA
    , rRectC
    , rect
    , rectA
    , rectC
    , south
    , stroke
    , strokeColor
    , strokeDash
    , strokeWidth
    , tabularNums
    , textA
    , textC
    , textParser
    , user
    , vectorLength
    , west
    )

import Basics.Extra exposing (..)
import Color as C
import Color.Convert as CC
import Colors exposing (..)
import Css
import Dict as DI
import Json.Decode as D
import List as L
import Maybe as M
import Parser as P exposing ((|.), (|=))
import Result as R
import String as ST
import Svg.Styled as S
import Svg.Styled.Attributes as SA
import Svg.Styled.Events as SE
import Utils exposing (..)


type alias Xywh =
    { x : Float, y : Float, w : Float, h : Float }


type alias Xywhr =
    { x : Float, y : Float, w : Float, h : Float, r : Float }


type alias Xyr =
    { x : Float, y : Float, r : Float }


type alias LineConfig =
    { x1 : Float, y1 : Float, x2 : Float, y2 : Float, arrow : Maybe Float }


type alias QBezierConfig =
    { x1 : Float, y1 : Float, cx : Float, cy : Float, x2 : Float, y2 : Float }


type Element msg
    = Element Shape (Style msg)


type Shape
    = Rect Xywhr
    | Circle Xyr
    | Line LineConfig
    | QBezier QBezierConfig
    | Complex { x : Float, y : Float, w : Float, h : Float, scale : Float, paths : List String }
    | Text TextConfig


type alias TextConfig =
    { x : Float, y : Float, size : Float, text : String, anchor : TextAnchor, baseline : TextBaseline }


type TextAnchor
    = Start
    | TAMiddle
    | End


type TextBaseline
    = Alphabetic
    | TBMiddle
    | Hanging


type alias Stencil =
    { w : Float
    , h : Float
    , paths : List String
    }


type alias Anchor =
    { x : Float, y : Float }


type PointerEvents
    = PENone
    | VisiblePainted


type alias Style msg =
    { layer : Int
    , hidden : Bool
    , stroke : Maybe C.Color
    , strokeWidth : Maybe Float
    , strokeDash : Maybe (List Float)
    , strokeDashoffset : Maybe Float
    , fill : Maybe C.Color
    , id : Maybe String
    , onMouseEnter : Maybe msg
    , onMouseLeave : Maybe msg
    , onClick : Maybe msg
    , pointerEvents : Maybe PointerEvents
    , hoverFill : Maybe C.Color
    , activeFill : Maybe C.Color
    , tabularNums : Bool
    }


type alias StylesDict =
    DI.Dict String Css.Style


noStyle : Style msg
noStyle =
    { layer = 0
    , hidden = False
    , stroke = Nothing
    , strokeWidth = Nothing
    , strokeDash = Nothing
    , strokeDashoffset = Nothing
    , fill = Nothing
    , id = Nothing
    , onMouseEnter = Nothing
    , onMouseLeave = Nothing
    , onClick = Nothing
    , pointerEvents = Nothing
    , hoverFill = Nothing
    , activeFill = Nothing
    , tabularNums = False
    }


applyStyle : (Style msg -> Maybe a) -> (Maybe a -> Style msg -> Style msg) -> a -> Element msg -> Element msg
applyStyle get set s ((Element shape style) as e) =
    case get style of
        Just _ ->
            e

        Nothing ->
            Element shape <| set (Just s) style


onLayer : Int -> Element msg -> Element msg
onLayer i (Element shape style) =
    Element shape { style | layer = i }


addToLayer : Int -> Element msg -> Element msg
addToLayer i (Element shape style) =
    Element shape { style | layer = style.layer + i }


hide : Element msg -> Element msg
hide (Element shape style) =
    Element shape { style | hidden = True }


fill : C.Color -> Element msg -> Element msg
fill =
    applyStyle .fill (\b a -> { a | fill = b })


stroke : C.Color -> Float -> Element msg -> Element msg
stroke c w =
    strokeColor c >> strokeWidth w


strokeColor : C.Color -> Element msg -> Element msg
strokeColor =
    applyStyle .stroke (\b a -> { a | stroke = b })


strokeWidth : Float -> Element msg -> Element msg
strokeWidth =
    applyStyle .strokeWidth (\b a -> { a | strokeWidth = b })


strokeDash : List Float -> Element msg -> Element msg
strokeDash =
    applyStyle .strokeDash (\b a -> { a | strokeDash = b })


id : String -> Element msg -> Element msg
id =
    applyStyle .id (\b a -> { a | id = b })


onMouseEnter : msg -> Element msg -> Element msg
onMouseEnter =
    applyStyle .onMouseEnter (\b a -> { a | onMouseEnter = b })


onMouseLeave : msg -> Element msg -> Element msg
onMouseLeave =
    applyStyle .onMouseLeave (\b a -> { a | onMouseLeave = b })


onClick : msg -> Element msg -> Element msg
onClick =
    applyStyle .onClick (\b a -> { a | onClick = b })


hoverFill : C.Color -> Element msg -> Element msg
hoverFill =
    applyStyle .hoverFill (\b a -> { a | hoverFill = b })


activeFill : C.Color -> Element msg -> Element msg
activeFill =
    applyStyle .activeFill (\b a -> { a | activeFill = b })


pointerEventsToString : PointerEvents -> String
pointerEventsToString pe =
    case pe of
        PENone ->
            "none"

        VisiblePainted ->
            "visiblePainted"


pointerEvents : PointerEvents -> Element msg -> Element msg
pointerEvents =
    applyStyle .pointerEvents (\b a -> { a | pointerEvents = b })


tabularNums : Element msg -> Element msg
tabularNums (Element shape style) =
    Element shape { style | tabularNums = True }


draw : Element msg -> List (S.Svg msg)
draw (Element shape style) =
    let
        styleAttrs : List (S.Attribute msg)
        styleAttrs =
            flattenMaybe
                [ M.map (SA.stroke << CC.colorToCssRgba) style.stroke
                , M.map (SA.strokeWidth << ST.fromFloat) style.strokeWidth
                , M.map (SA.strokeDasharray << ST.join " " << L.map ST.fromFloat) style.strokeDash
                , M.map (SA.strokeDashoffset << ST.fromFloat) style.strokeDashoffset
                , M.map (SA.fill << CC.colorToCssRgba) style.fill
                , M.map SA.id style.id
                , M.map (SE.on "mouseenter" << D.succeed) style.onMouseEnter
                , M.map (SE.on "mouseleave" << D.succeed) style.onMouseLeave
                , M.map SE.onClick style.onClick
                , M.map (SA.pointerEvents << pointerEventsToString) style.pointerEvents
                , M.map SA.css
                    << listToMaybe
                  <|
                    flattenMaybe
                        [ M.map (Css.hover << L.singleton << Css.fill << colorToCss) style.hoverFill
                        , M.map (Css.active << L.singleton << Css.fill << colorToCss) style.activeFill
                        , if style.hidden then
                            Just (Css.visibility Css.hidden)

                          else
                            Nothing
                        , if style.tabularNums then
                            Just (Css.fontVariantNumeric Css.tabularNums)

                          else
                            Nothing
                        ]
                ]
    in
    case shape of
        Rect { x, y, w, h, r } ->
            [ S.rect
                (L.concat
                    [ L.map2
                        ((>>) ST.fromFloat)
                        [ SA.x, SA.y, SA.width, SA.height ]
                        [ x, y, w, h ]
                    , if r == 0 then
                        []

                      else
                        [ SA.rx <| ST.fromFloat r ]
                    , styleAttrs
                    ]
                )
                []
            ]

        Circle { x, y, r } ->
            [ S.circle
                (L.append
                    (L.map2
                        ((>>) ST.fromFloat)
                        [ SA.cx, SA.cy, SA.r ]
                        [ x, y, r ]
                    )
                    styleAttrs
                )
                []
            ]

        Line { x1, y1, x2, y2, arrow } ->
            case arrow of
                Nothing ->
                    [ S.line
                        (L.append
                            (L.map2
                                ((>>) ST.fromFloat)
                                [ SA.x1, SA.y1, SA.x2, SA.y2 ]
                                [ x1, y1, x2, y2 ]
                            )
                            styleAttrs
                        )
                        []
                    ]

                Just size ->
                    let
                        arrowWidth =
                            M.withDefault 0 style.strokeWidth * size

                        arrowLength =
                            arrowWidth / 1.2

                        totalLength =
                            vectorLength (x2 - x1) (y2 - y1)

                        lineLength =
                            totalLength - arrowLength

                        jointX =
                            x1 + (x2 - x1) * lineLength / totalLength

                        jointY =
                            y1 + (y2 - y1) * lineLength / totalLength

                        rotation =
                            atan2 (y2 - y1) (x2 - x1) |> inDegrees
                    in
                    [ S.line
                        (L.append
                            (L.map2
                                ((>>) ST.fromFloat)
                                [ SA.x1, SA.y1, SA.x2, SA.y2 ]
                                [ x1, y1, jointX, jointY ]
                            )
                            styleAttrs
                        )
                        []
                    , S.polygon
                        (L.append
                            [ transforms [ translate jointX jointY, tScale arrowLength, rotate rotation ]
                            , points [ ( 0, 0 ), ( -0.5, -0.6 ), ( 1, 0 ), ( -0.5, 0.6 ) ]
                            ]
                            << maybeToList
                         <|
                            M.map (SA.fill << CC.colorToCssRgba) style.stroke
                        )
                        []
                    ]

        QBezier { x1, y1, cx, cy, x2, y2 } ->
            [ S.path
                (L.append
                    [ SA.d <|
                        ("M{x1} {y1}Q{cx} {cy} {x2} {y2}"
                            |> fFloat "x1" x1
                            |> fFloat "y1" y1
                            |> fFloat "cx" cx
                            |> fFloat "cy" cy
                            |> fFloat "x2" x2
                            |> fFloat "y2" y2
                        )
                    , SA.fill "none"
                    ]
                    styleAttrs
                )
                []
            ]

        Complex { x, y, scale, paths } ->
            [ S.g
                (transforms [ translate x y, tScale scale ] :: styleAttrs)
              <|
                L.map (\p -> S.path [ SA.d p ] []) paths
            ]

        Text t ->
            let
                anchor =
                    case t.anchor of
                        Start ->
                            "start"

                        TAMiddle ->
                            "middle"

                        End ->
                            "end"

                shift =
                    textBaselineToOffset Alphabetic - textBaselineToOffset t.baseline

                -- fragments =
                --     R.withDefault [ Plain t.text ] <| P.run textParser t.text
                results =
                    P.run textParser t.text

                fragments =
                    case results of
                        Ok f ->
                            f

                        Err ds ->
                            let
                                d =
                                    L.head ds
                            in
                            [ Plain <| M.withDefault "" <| M.map (\{ col } -> ST.fromInt col) d ]
            in
            [ S.text_
                (L.concat
                    [ L.map2
                        ((>>) ST.fromFloat)
                        [ SA.x, SA.y, SA.fontSize ]
                        [ t.x, t.y + shift * t.size, t.size ]
                    , [ SA.textAnchor anchor ]
                    , styleAttrs
                    ]
                )
              <|
                L.map drawFragment fragments
            ]


drawFragment : Fragment -> S.Svg msg
drawFragment f =
    case f of
        Plain t ->
            S.text t

        Span { styles, text } ->
            S.tspan [ SA.css << flattenMaybe <| L.map (\s -> DI.get s stylesDict) styles ] [ S.text text ]


baseStylesDict : StylesDict
baseStylesDict =
    DI.fromList
        [ ( "b", Css.fontWeight Css.bold )
        ]


stylesDict : StylesDict
stylesDict =
    DI.union baseStylesDict <| DI.map (\_ c -> Css.fill <| colorToCss c) colorsDict


transforms : List String -> S.Attribute msg
transforms l =
    SA.transform <| ST.join " " l


tScale : Float -> String
tScale s =
    "scale(" ++ ST.fromFloat s ++ ")"


translate : Float -> Float -> String
translate x y =
    "translate(" ++ ST.fromFloat x ++ " " ++ ST.fromFloat y ++ ")"


rotate : Float -> String
rotate d =
    "rotate(" ++ ST.fromFloat d ++ ")"


points : List ( Float, Float ) -> S.Attribute msg
points p =
    SA.points << ST.join " " <| L.map (\( x, y ) -> ST.fromFloat x ++ "," ++ ST.fromFloat y) p


rect : Xywh -> Element msg
rect { x, y, w, h } =
    Element (Rect { x = x, y = y, w = w, h = h, r = 0 }) noStyle


rectC : Xywh -> Element msg
rectC { x, y, w, h } =
    Element (Rect { x = x - w / 2, y = y - h / 2, w = w, h = h, r = 0 }) noStyle


rRect : Xywhr -> Element msg
rRect { x, y, w, h, r } =
    Element (Rect { x = x, y = y, w = w, h = h, r = r }) noStyle


rRectC : Xywhr -> Element msg
rRectC { x, y, w, h, r } =
    Element (Rect { x = x - w / 2, y = y - h / 2, w = w, h = h, r = r }) noStyle


rectA : Anchor -> Xywh -> Element msg
rectA a { x, y, w, h } =
    Element (Rect { x = x - a.x * w, y = y - a.y * h, w = w, h = h, r = 0 }) noStyle


rRectA : Anchor -> Xywhr -> Element msg
rRectA a { x, y, w, h, r } =
    Element (Rect { x = x - a.x * w, y = y - a.y * h, w = w, h = h, r = r }) noStyle


circle : Xyr -> Element msg
circle xyr =
    Element (Circle xyr) noStyle


line : LineConfig -> Element msg
line c =
    Element (Line c) noStyle


qBezier : QBezierConfig -> Element msg
qBezier c =
    Element (QBezier c) noStyle


complexCW : Stencil -> { x : Float, y : Float, w : Float } -> Element msg
complexCW s { x, y, w } =
    let
        scale =
            w / s.w
    in
    Element (Complex { x = x - w / 2, y = y - s.h / 2 * scale, w = w, h = s.h * scale, scale = scale, paths = s.paths }) noStyle


complexCH : Stencil -> { x : Float, y : Float, h : Float } -> Element msg
complexCH s { x, y, h } =
    let
        scale =
            h / s.h
    in
    Element (Complex { x = x - s.w / 2 * scale, y = y - h / 2, w = s.w * scale, h = h, scale = scale, paths = s.paths }) noStyle


user : Stencil
user =
    { w = 100
    , h = 100
    , paths =
        [ "M49.4,48.2c6.6,0,12.3-2.4,17-7.1c4.7-4.7,7.1-10.4,7.1-17c0-6.6-2.4-12.3-7.1-17C61.7,2.4,56,0,49.4,0"
            ++ "c-6.6,0-12.3,2.4-17,7.1s-7.1,10.4-7.1,17c0,6.6,2.4,12.3,7.1,17C37,45.8,42.8,48.2,49.4,48.2z"
        , "M91.5,76.9c-0.1-1.9-0.4-4.1-0.8-6.3c-0.4-2.3-0.9-4.4-1.6-6.4c-0.6-2-1.5-4-2.6-5.9c-1.1-2-2.5-3.7-3.9-5.1"
            ++ "c-1.6-1.5-3.5-2.7-5.7-3.6c-2.2-0.9-4.6-1.3-7.2-1.3c-1,0-2,0.4-3.9,1.7c-1.2,0.8-2.5,1.7-4.1,2.6c-1.3,0.8-3.1,1.6-5.3,2.3"
            ++ "c-2.1,0.7-4.3,1-6.5,1s-4.3-0.4-6.5-1c-2.2-0.7-4-1.5-5.3-2.3c-1.5-1-2.9-1.9-4.1-2.6c-1.9-1.2-2.9-1.7-3.9-1.7"
            ++ "c-2.6,0-5,0.4-7.2,1.3c-2.2,0.9-4.1,2.1-5.7,3.6c-1.5,1.4-2.8,3.1-3.9,5.1c-1.1,1.9-2,3.9-2.6,5.9c-0.6,2-1.1,4.1-1.6,6.4"
            ++ "c-0.4,2.2-0.7,4.4-0.8,6.3c-0.1,1.9-0.2,3.9-0.2,5.9c0,5.2,1.7,9.4,4.9,12.6c3.2,3.1,7.5,4.6,12.7,4.6h48.2c5.2,0,9.5-1.6,12.7-4.6"
            ++ "c3.3-3.1,4.9-7.3,4.9-12.6C91.7,80.8,91.6,78.8,91.5,76.9z"
        ]
    }


check : Stencil
check =
    { w = 100
    , h = 100
    , paths = [ "M0 54L18 36L37 58L81 6L100 22L37 93z" ]
    }


textC : String -> { x : Float, y : Float, size : Float } -> Element msg
textC t { x, y, size } =
    Element (Text { x = x, y = y, size = size, text = t, anchor = TAMiddle, baseline = TBMiddle }) noStyle


textA : String -> TextAnchor -> { x : Float, y : Float, size : Float } -> Element msg
textA t a { x, y, size } =
    Element (Text { x = x, y = y, size = size, text = t, anchor = a, baseline = TBMiddle }) noStyle


textAnchorToOffset : TextAnchor -> Float
textAnchorToOffset a =
    case a of
        Start ->
            0

        TAMiddle ->
            0.5

        End ->
            1


textBaselineToOffset : TextBaseline -> Float
textBaselineToOffset b =
    case b of
        Alphabetic ->
            0.8

        TBMiddle ->
            0.48

        Hanging ->
            0


listToMaybe : List a -> Maybe (List a)
listToMaybe l =
    case l of
        [] ->
            Nothing

        _ ->
            Just l


fFloat : String -> Float -> String -> String
fFloat old new =
    ST.replace ("{" ++ old ++ "}") (ST.fromFloat new)


west : Anchor
west =
    { x = 0, y = 0.5 }


south : Anchor
south =
    { x = 0.5, y = 1 }


oppositeAnchor : Anchor -> Anchor
oppositeAnchor { x, y } =
    { x = 1 - x, y = 1 - y }


oppositeTextAnchor : TextAnchor -> TextAnchor
oppositeTextAnchor a =
    case a of
        Start ->
            End

        TAMiddle ->
            TAMiddle

        End ->
            Start


mapElement : (a -> b) -> Element a -> Element b
mapElement f (Element shape style) =
    Element shape (mapStyle f style)


mapStyle : (a -> b) -> Style a -> Style b
mapStyle f s =
    { layer = s.layer
    , hidden = s.hidden
    , stroke = s.stroke
    , strokeWidth = s.strokeWidth
    , strokeDash = s.strokeDash
    , strokeDashoffset = s.strokeDashoffset
    , fill = s.fill
    , id = s.id
    , onMouseEnter = M.map f s.onMouseEnter
    , onMouseLeave = M.map f s.onMouseLeave
    , onClick = M.map f s.onClick
    , pointerEvents = s.pointerEvents
    , hoverFill = s.hoverFill
    , activeFill = s.activeFill
    , tabularNums = s.tabularNums
    }


vectorLength : Float -> Float -> Float
vectorLength x y =
    sqrt <| x ^ 2 + y ^ 2


type Fragment
    = Plain String
    | Span
        { styles : List String
        , text : String
        }


textParser : P.Parser (List Fragment)
textParser =
    P.loop [] textParserHelp


textParserHelp : List Fragment -> P.Parser (P.Step (List Fragment) (List Fragment))
textParserHelp fs =
    P.oneOf
        [ P.succeed (\s t -> P.Loop (Span { styles = ST.split " " s, text = t } :: fs))
            |. P.chompIf (\c -> c == '[')
            |= (P.chompWhile (\c -> c /= '|') |> P.getChompedString)
            |. P.token "|"
            |= (P.chompWhile (\c -> c /= ']') |> P.getChompedString)
            |. P.token "]"
        , P.succeed
            (\start t end ->
                if start == end then
                    P.Done (L.reverse fs)

                else
                    P.Loop (Plain t :: fs)
            )
            |= P.getOffset
            |= (P.chompWhile (\c -> c /= '[') |> P.getChompedString)
            |= P.getOffset
        ]


getAnchorPos : Shape -> Anchor -> { x : Float, y : Float }
getAnchorPos s a =
    case s of
        Rect r ->
            { x = r.x + a.x * r.w
            , y = r.y + a.y * r.h
            }

        Circle c ->
            let
                x =
                    a.x - 0.5

                y =
                    a.y - 0.5

                r =
                    vectorLength x y
            in
            { x = c.x + x / r * c.r
            , y = c.y + y / r * c.r
            }

        Line l ->
            { x = l.x1 + a.x * (l.x2 - l.x1)
            , y = l.y1 + a.x * (l.y2 - l.y1)
            }

        QBezier q ->
            let
                t =
                    a.x
            in
            { x = (1 - t) ^ 2 * q.x1 + 2 * (1 - t) * t * q.cx + t ^ 2 * q.x2
            , y = (1 - t) ^ 2 * q.y1 + 2 * (1 - t) * t * q.cy + t ^ 2 * q.y2
            }

        Complex c ->
            { x = c.x + a.x * c.w
            , y = c.y + a.y * c.h
            }

        _ ->
            { x = 0, y = 0 }


getTextAnchorPos : TextConfig -> Float -> Anchor -> { x : Float, y : Float }
getTextAnchorPos t w a =
    { x = t.x + (a.x - textAnchorToOffset t.anchor) * w
    , y = t.y + (a.y - textBaselineToOffset t.baseline) * t.size
    }
