type Point = [number, number];


export interface RawData {
	chars: string;
	type: string;
	origin: Point;
}

export let SIZE_0_ORIENTATION_0: RawData = {
	chars: String.raw`
\-9
|../
7.o.\
 /.$/
  \/
`,
	type: String.raw`
ww9
wwws
7wwww
 sw$w
  ww
`,
	origin: [2, 2]
}


export let SIZE_0_ORIENTATION_1: RawData = {
	chars: String.raw`
  |
 /.\
 7.9
--o--
 |$|
 ---
`,
	type: String.raw`
  w
 www
 7w9
sswss
 w$w
 www
`,
	origin: [2, 3]
}

export let SIZE_1_ORIENTATION_0: RawData = {
	chars: String.raw`
\
 \--9/
 |../\
 |.o..6/
 7/.../\
 /\..o..\
   4/.$./
   /\../
     \/
`,
	type: String.raw`
w
 www9s
 wwwsw
 wwwww6s
 7swwwsw
 swwwwwww
   4sw$ww
   swwww
     ww
`,
	origin: [4, 4]
}

export let SIZE_1_ORIENTATION_1: RawData = {
	chars: String.raw`
   |
   |
  /.\
 7...9
---o---
 |...|
 4...6
---o---
 |.$.|
 -----
`,
	type: String.raw`
   w
   w
  www
 7www9
ssswsss
 wwwww
 4www6
ssswsss
 ww$ww
 wwwww
`,
	origin: [3, 5]
}

export let SIZE_2_ORIENTATION_0: RawData = {
	chars: String.raw`
\
 \
  \--9/
  |../\
  |.o..6/
  7/.../\
  /\..o..3/
    4/.../\
    /\..o..\
      1/.$./
      /\../
        \/
`,
	type: String.raw`
w
 w
  www9s
  wwwsw
  wwwww6s
  7swwwsw
  swwwwww3s
    4swwwsw
    swwwwwww
      1sw$ww
      swwww
        ww
`,
	origin: [6, 6]
}

export let SIZE_2_ORIENTATION_1: RawData = {
	chars: String.raw`
   |
   |
   |
  /.\
 7...9
---o---
 |...|
 4...6
---o---
 |...|
 1...3
---o---
 |.$.|
 -----
`,
	type: String.raw`
   w
   w
   w
  www
 7www9
ssswsss
 wwwww
 4www6
ssswsss
 wwwww
 1www3
ssswsss
 ww$ww
 wwwww
`,
	origin: [3, 8]
}
