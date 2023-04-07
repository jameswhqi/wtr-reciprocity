module Utils exposing (..)

import Html exposing (a)


maybeToList : Maybe a -> List a
maybeToList m =
    case m of
        Just a ->
            [ a ]

        Nothing ->
            []
