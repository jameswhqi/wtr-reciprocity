module Colors exposing (..)

import Color as C


type alias Hue =
    Int -> C.Color


reds : Hue
reds l =
    case l of
        1 ->
            C.rgb255 17 2 1

        2 ->
            C.rgb255 39 5 2

        3 ->
            C.rgb255 59 13 6

        4 ->
            C.rgb255 79 19 10

        5 ->
            C.rgb255 98 24 13

        6 ->
            C.rgb255 117 31 18

        7 ->
            C.rgb255 135 37 23

        8 ->
            C.rgb255 153 46 30

        9 ->
            C.rgb255 172 52 34

        10 ->
            C.rgb255 193 57 37

        11 ->
            C.rgb255 212 65 44

        12 ->
            C.rgb255 223 84 61

        13 ->
            C.rgb255 234 102 78

        14 ->
            C.rgb255 242 122 99

        15 ->
            C.rgb255 250 142 121

        16 ->
            C.rgb255 254 164 145

        17 ->
            C.rgb255 255 187 172

        18 ->
            C.rgb255 252 210 202

        19 ->
            C.rgb255 254 232 228

        _ ->
            C.red


greens : Hue
greens l =
    case l of
        1 ->
            C.rgb255 0 9 0

        2 ->
            C.rgb255 1 25 0

        3 ->
            C.rgb255 2 39 1

        4 ->
            C.rgb255 3 54 2

        5 ->
            C.rgb255 1 68 0

        6 ->
            C.rgb255 3 81 1

        7 ->
            C.rgb255 3 95 1

        8 ->
            C.rgb255 14 108 7

        9 ->
            C.rgb255 13 122 6

        10 ->
            C.rgb255 7 136 3

        11 ->
            C.rgb255 19 150 10

        12 ->
            C.rgb255 55 162 42

        13 ->
            C.rgb255 80 174 64

        14 ->
            C.rgb255 106 185 89

        15 ->
            C.rgb255 130 197 113

        16 ->
            C.rgb255 156 208 140

        17 ->
            C.rgb255 183 218 169

        18 ->
            C.rgb255 210 228 200

        19 ->
            C.rgb255 235 240 227

        _ ->
            C.green


blues : Hue
blues l =
    case l of
        1 ->
            C.rgb255 2 6 22

        2 ->
            C.rgb255 5 18 49

        3 ->
            C.rgb255 12 30 71

        4 ->
            C.rgb255 18 42 95

        5 ->
            C.rgb255 23 53 120

        6 ->
            C.rgb255 29 64 142

        7 ->
            C.rgb255 35 75 165

        8 ->
            C.rgb255 44 87 183

        9 ->
            C.rgb255 49 98 208

        10 ->
            C.rgb255 54 109 234

        11 ->
            C.rgb255 62 121 254

        12 ->
            C.rgb255 83 136 253

        13 ->
            C.rgb255 103 150 254

        14 ->
            C.rgb255 125 165 251

        15 ->
            C.rgb255 146 179 250

        16 ->
            C.rgb255 169 193 248

        17 ->
            C.rgb255 192 207 244

        18 ->
            C.rgb255 216 222 242

        19 ->
            C.rgb255 237 238 246

        _ ->
            C.blue


magentas : Hue
magentas l =
    case l of
        1 ->
            C.rgb255 15 1 14

        2 ->
            C.rgb255 36 4 35

        3 ->
            C.rgb255 54 10 53

        4 ->
            C.rgb255 72 15 71

        5 ->
            C.rgb255 91 18 89

        6 ->
            C.rgb255 108 24 106

        7 ->
            C.rgb255 126 28 124

        8 ->
            C.rgb255 142 38 139

        9 ->
            C.rgb255 160 42 158

        10 ->
            C.rgb255 179 44 177

        11 ->
            C.rgb255 197 53 193

        12 ->
            C.rgb255 206 79 200

        13 ->
            C.rgb255 215 101 208

        14 ->
            C.rgb255 222 123 213

        15 ->
            C.rgb255 229 144 219

        16 ->
            C.rgb255 234 167 224

        17 ->
            C.rgb255 238 189 228

        18 ->
            C.rgb255 242 212 233

        19 ->
            C.rgb255 249 233 242

        _ ->
            C.rgb 1 0 1


grays : Hue
grays l =
    case l of
        0 ->
            C.rgb255 0 0 0

        1 ->
            C.rgb255 13 13 13

        2 ->
            C.rgb255 26 26 26

        3 ->
            C.rgb255 38 38 38

        4 ->
            C.rgb255 51 51 51

        5 ->
            C.rgb255 64 64 64

        6 ->
            C.rgb255 76 76 76

        7 ->
            C.rgb255 89 89 89

        8 ->
            C.rgb255 102 102 102

        9 ->
            C.rgb255 115 115 115

        10 ->
            C.rgb255 128 128 128

        11 ->
            C.rgb255 140 140 140

        12 ->
            C.rgb255 153 153 153

        13 ->
            C.rgb255 166 166 166

        14 ->
            C.rgb255 178 178 178

        15 ->
            C.rgb255 191 191 191

        16 ->
            C.rgb255 204 204 204

        17 ->
            C.rgb255 217 217 217

        18 ->
            C.rgb255 230 230 230

        19 ->
            C.rgb255 242 242 242

        20 ->
            C.rgb255 255 255 255

        _ ->
            C.gray


transparent : C.Color
transparent =
    C.rgba 0 0 0 0


setAlpha : Float -> C.Color -> C.Color
setAlpha a c =
    let
        rgba =
            C.toRgba c
    in
    C.fromRgba <| { rgba | alpha = a }
