module Utils exposing (..)

import Html exposing (a)
import List as L


maybeToList : Maybe a -> List a
maybeToList m =
    case m of
        Just a ->
            [ a ]

        Nothing ->
            []


maybeListToList : Maybe (List a) -> List a
maybeListToList =
    maybeToList >> L.concat
