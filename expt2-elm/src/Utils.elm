module Utils exposing (..)

import Colors exposing (..)
import Css as S
import Json.Decode as D
import Json.Encode as E
import List as L
import Maybe as M
import Platform.Cmd as C


type alias BBox =
    { x : Float, y : Float, width : Float, height : Float }


type alias Point =
    { x : Float, y : Float }


type alias Setter a b =
    (b -> b) -> a -> a


maybeToList : Maybe a -> List a
maybeToList m =
    case m of
        Just a ->
            [ a ]

        Nothing ->
            []


flattenMaybe : List (Maybe a) -> List a
flattenMaybe =
    L.concatMap maybeToList


chainUpdates : List (a -> ( a, Cmd msg )) -> a -> ( a, Cmd msg )
chainUpdates l m0 =
    let
        ( mFinal, lcFinal ) =
            L.foldl folder ( m0, [] ) l

        folder u ( m1, lc ) =
            let
                ( m2, c ) =
                    u m1
            in
            ( m2, c :: lc )
    in
    ( mFinal, C.batch lcFinal )


set : Setter a b -> b -> a -> a
set setter =
    setter << always


maybeSet : Setter a b -> Maybe b -> a -> a
maybeSet setter value =
    M.withDefault identity <| M.map (setter << always) value


pointThen : (Point -> a) -> Float -> Float -> a
pointThen f x y =
    f <| Point x y


inBBox : Float -> Float -> BBox -> Bool
inBBox x y b =
    x > b.x && x < b.x + b.width && y > b.y && y < b.y + b.height


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


buttonStyle : S.Style
buttonStyle =
    S.batch
        [ S.border3 (S.px 2) S.solid (colorToCss <| grays 0)
        , S.padding2 (S.em 0.3) (S.em 1)
        , S.fontSize <| S.px 24
        , S.backgroundColor <| S.hex "fff"
        , S.hover [ S.backgroundColor <| colorToCss <| grays 18 ]
        , S.active [ S.backgroundColor <| colorToCss <| grays 16 ]
        , S.disabled
            [ S.backgroundColor <| S.hex "fff"
            , S.color <| colorToCss <| grays 16
            , S.borderColor <| colorToCss <| grays 16
            ]
        ]
