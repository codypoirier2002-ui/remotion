# DECISIONES

Dos vídeos de 15 segundos, uno por nombre, **CODY** y **POIRIER**; uno de 30
segundos en el que el primero desemboca en el segundo y termina con el nombre
completo; otros dos de 15 segundos sin una sola letra, cada uno con su
estilo: **LUMEN**, puntos de luz en la oscuridad, y **SPLASH**, pintura espesa
a todo color; y **COSMOS**, un minuto en vertical que cuenta 13.800 millones
de años de historia del universo, hecho a partir de un vídeo de referencia.
Todo es código: la tipografía, el movimiento, la luz, la pintura, los
paisajes y la música. No hay imágenes, vídeo de archivo ni muestras de audio.

Este documento tiene seis partes, en el orden en que se encargaron: CODY,
luego POIRIER y la unión, después LUMEN, SPLASH, COSMOS y, al final, COSMOS
en horizontal.

## Resultado

| Archivo | Qué es | Duración | Fotogramas | Tamaño |
| --- | --- | --- | --- | --- |
| `cody.mp4` | CODY | 15,000000 s | 900 | 20,3 MB |
| `poirier.mp4` | POIRIER, se sostiene solo | 15,000000 s | 900 | 19,5 MB |
| `cody-poirier.mp4` | Los dos unidos | 30,000000 s | 1800 | 39,8 MB |
| `lumen.mp4` | LUMEN, sin palabras | 15,000000 s | 900 | 31,8 MB |
| `splash.mp4` | SPLASH, sin palabras | 15,000000 s | 900 | 17,1 MB |
| `cosmos.mp4` | COSMOS, vertical | 60,000000 s | 1800 | 20,2 MB |
| `cosmos-wide.mp4` | COSMOS, horizontal | 60,000000 s | 1800 | 46,1 MB |

Los cinco primeros: H.264, 1920×1080, 60 fps. COSMOS: H.264, 1080×1920
(vertical), 30 fps, como su referencia; y su versión horizontal, 1920×1080 a
30 fps. Todos con AAC estéreo a 48 kHz. Medido con `ffprobe`
sobre cada archivo final, contando los fotogramas decodificados uno a uno
(`-count_frames`). La duración es la misma en el vídeo, en el audio y en el
contenedor.

# Primera parte: CODY

## La idea

Una sola: **las letras son objetos físicos hechos de trazo.**

Las cuatro letras están dibujadas en el código como líneas con grosor: la C es
un arco, la O un círculo, la D una barra y medio círculo, la Y tres barras. Como
son trazos y no contornos, el grosor es un parámetro vivo. Una letra puede
empezar como una línea fina de plano técnico y engordar hasta negrita con un
muelle, y puede desmontarse en las nueve piezas de las que está hecha. Todo lo
que pasa en el vídeo sale de ahí.

## Qué elegí y por qué

**Tipografía propia en vez de una fuente.** Con una fuente solo se puede mover,
escalar y recortar. Con letras dibujadas a trazo puedo animar el peso, dibujarlas
en pantalla y partirlas en piezas reales. Además no depende de descargar nada.

**Cuatro colores y ninguno más.** Tinta `#101014`, hueso `#F3EDE2`, bermellón
`#FF4A1C` y cobalto `#2A3CFF`. Es la paleta de cartel de imprenta: un oscuro, un
claro y dos colores que chocan. Los fondos cambian de color en los golpes, y con
cuatro tintas cualquier combinación funciona.

**Profundidad con planchas de imprenta, no con brillos.** Detrás de cada letra
hay dos copias desplazadas, una bermellón y otra cobalto, como una impresión mal
registrada. En cada golpe las planchas saltan y vuelven. Da volumen sin salir
del estilo plano. En el último golpe las planchas se alinean del todo y las
letras quedan limpias: ese es el final.

**Un punto como hilo.** El vídeo abre con un punto que cae, y cierra con ese
mismo punto entrando a botes para quedarse como punto final de `CODY.`

**132 BPM.** A ese tempo 15 segundos son exactamente 33 tiempos: uno de
anacrusa y ocho compases. Cada corte de escena cae en una barra de compás y el
último golpe deja 1,8 s para que el nombre repose.

**Un motivo de cuatro notas, una por letra.** Fa, La♭, Si♭, Do. Suena cada vez
que las letras aparecen de una en una: los cuatro acordes del arranque, las
campanas cuando cada letra engorda, el bajo cuando cada letra hace su solo y
los cuatro timbales cuando aterrizan al final.

**Una sola partitura para imagen y sonido.** `src/score.ts` contiene cada nota y
cada golpe. El sintetizador la lee para generar el audio y las escenas la leen
para moverse. No hay tiempos escritos dos veces, así que no pueden desajustarse.
La imagen va adelantada medio fotograma para que cada golpe caiga en el
fotograma más cercano al sonido y no en el siguiente.

**Movimiento con muelles.** Nada usa curvas lineales. Todo son muelles
amortiguados calculados en segundos reales: lo que llega se pasa de largo y
vuelve, lo que aterriza se aplasta contra el suelo y rebota, lo que cae se
estira. Los contactos caen sobre el tiempo: la caída empieza antes para que el
golpe coincida con el sonido.

**Estructura, un compás por idea.**

| Tiempo | Compás | Qué pasa |
| --- | --- | --- |
| 0,00 s | anacrusa | Un punto cae, golpea el suelo y se carga. |
| 0,45 s | 1 | El punto revienta. C, O, D, Y: una letra gigante por golpe, cada fondo de un color, cada letra entra a su manera. |
| 2,27 s | 2 | El nombre se construye: líneas finas, y cada letra engorda en su nota. |
| 4,09 s | 3 | Primera rotura: el nombre cortado en bandas que se desplazan en cada acorde y vuelven de golpe. |
| 5,91 s | 4 | Segunda rotura: estalla en sus nueve piezas, y la subida las arrastra en espiral hasta un punto. Medio tiempo de silencio y negro. |
| 7,73 s | 5 | **El momento grande.** El punto detona: destello, todo bermellón, el nombre llena la pantalla, ondas y escombros. |
| 9,55 s | 6 | Un solo por letra: la C gira, la O salta, la D se voltea, la Y gira y salta. |
| 11,36 s | 7 | Tercera rotura: el nombre se multiplica en un muro de filas que luego se pliega. Las cuatro letras caen, una por timbal. |
| 13,18 s | 8 | Último golpe. Las planchas se registran. Entra el punto. Quieto. |

**La música.** Síntesis sustractiva y un poco de FM, escrita en TypeScript:
bombo, palmas, caja, platos, timbales, bajo, acordes de sierras desafinadas,
arpegio, melodía y campanas. Reverberación, eco, compresión lateral con el bombo
y saturación suave en el máster. El resultado es un WAV determinista: la misma
ejecución da siempre el mismo archivo.

## Qué descarté

- **Una fuente de Google Fonts.** No se puede engordar ni desmontar, y dependía
  de la red.
- **La C cortada con una línea vertical.** Fue mi primer dibujo. En negrita el
  hueco se cerraba y parecía una O con un lado plano. La rehice como arco de
  280° con los extremos apuntando al centro.
- **Un quinto color (amarillo), neón, degradados y 3D.** Cualquiera de ellos
  habría sido un segundo estilo.
- **128 y 120 BPM.** A 128 no cabía la anacrusa sin romper los compases. A 120
  sobraba medio compás.
- **Grano de película animado.** Cambiaba en cada fotograma y el archivo salía
  de 75,7 MB. Lo cambié por una textura fija, como papel: 20,3 MB, y encaja
  mejor con la idea de imprenta.
- **Desenfoque de movimiento real.** Multiplica el tiempo de render y a 60 fps
  el estiramiento de las formas ya hace ese trabajo.
- **Anillos circulares donde aterrizan las letras.** Cruzaban las letras y
  ensuciaban. Ahora son elipses planas en la línea base.
- **El punto final cayendo en vertical.** Atravesaba el brazo de la Y. Ahora
  entra botando desde la derecha y se para junto a ella.
- **Compilar el monorepo de Remotion.** Este proyecto usa el paquete publicado
  (4.0.545) y vive en su propia carpeta. Se puede copiar a cualquier sitio.

## Qué cambió entre versiones

Revisé fotogramas en cuatro pasadas: 383 en total, en hojas de contacto y
algunos a resolución completa.

**Antes de animar nada.** Un fotograma con las letras en todos los pesos. Ahí
vi que la C se cerraba y la rehice.

**Pasada 1 (126 fotogramas).**
- El compás 3 era ilegible: seis bandas alternando ±150 px. Lo cambié a tercios
  que van a un lado, cruzan al otro y terminan en cizalla.
- Las piezas del estallido salían del encuadre. Reduje el alcance un 28 %.
- Anillos de aterrizaje por elipses, y el punto final por la derecha.
- El punto inicial pasó de 28 a 40 px de radio.
- El compás 2 arrancaba con la pantalla casi negra justo en un bombo. Ahora las
  guías y el trazo empiezan en el corte.
- El muro se quedaba vacío medio tiempo. Ahora se pliega una fila por nota.

**Pasada 2 (96 fotogramas, con tiras de fotogramas consecutivos).**
- El rebanado seguía denso: de ±130 a ±88 px, y la cizalla de ±210 a ±160.
- La elipse de polvo del principio duraba demasiado y el punto parecía Saturno:
  de 0,32 a 0,19 s.
- Las ondas del último golpe seguían en pantalla cuando entraba el punto: de
  0,75 a 0,6 s.

**Pasada 3 (41 fotogramas, 9 a resolución completa).**
- Dos costuras de un píxel: entre bandas vecinas del rebanado y en el hueco de
  la D al separarse del asta. Corregidas.
- Grano fijo en vez de animado.

**Pasada 4, sobre el MP4 ya codificado (120 fotogramas).**
- La Y gigante aterrizaba tres fotogramas después del bombo. Ahora dos.
- El contenedor medía 15,019 s porque el codificador AAC rellena el último
  bloque. El paso final vuelve a unir la imagen con el WAV original cortado a
  15 s exactos.
- El audio codificado alcanzaba +0,4 dBTP. Bajé el pico del máster y quedó en
  −1,5 dBTP.

**La música, medida y corregida.**
- Primera mezcla: −6,4 LUFS con 0,8 LU de rango. Aplastada. Rebalanceé los
  buses y puse la subida 3 dB por debajo del drop: 4,9 LU de rango.
- El análisis por bandas decía que el drop perdía 21 dB entre los graves y los
  agudos. Demasiado oscura para altavoces pequeños. Tras reequilibrar, 14,5 dB.
- Un error real: el bajo sumaba una sierra y una cuadrada con la misma fase, y
  sus armónicos impares se cancelaban, incluida la fundamental. El bajo sonaba
  una octava arriba. Lo encontré porque la banda de 60–120 Hz estaba vacía en
  el acorde final.

## Sincronía, comprobada

- El audio dentro del MP4 está desplazado **0 muestras** respecto al WAV
  original (correlación cruzada).
- Los bombos caen a menos de 2 ms de su posición teórica en la rejilla, que es
  la resolución de la medida.
- Los golpes de imagen caen a menos de medio fotograma (±8 ms) del sonido:
  primer golpe −4,5 ms, drop +6,1 ms, golpe final +1,5 ms, aterrizaje del punto
  −3,0 ms.

## Lo que no pude comprobar

No puedo oír. La música está verificada con medidas: sonoridad, pico, balance
por bandas, posición de los ataques y sincronía. Que guste al oído es lo único
de este trabajo que no he podido juzgar yo.

## Cuánto tardó de verdad

Horas UTC tomadas del reloj del sistema y de la fecha de modificación de los
archivos, no estimadas.

| Hora | Hito |
| --- | --- |
| 15:20:07 | Empiezo. |
| 15:28:14 | Proyecto creado, dependencias instaladas, render de prueba hecho, plan decidido. |
| 15:30:10 | Primera versión de la pista sintetizada y medida. |
| 15:39:10 | Tipografía validada en un fotograma de prueba. |
| 15:44:43 | Las nueve escenas escritas. Primera hoja de contactos. |
| 15:45:53 | Fin de la pasada 1. |
| 15:48:49 | Pasada 2. |
| 15:51 | Primer render completo: 1 min 37 s, 75,7 MB. |
| 15:52:35 | Pasada 3. |
| 15:54 | Segundo render: 1 min 10 s, 20,3 MB. |
| 15:55:32 | Mezcla reequilibrada y analizada. |
| 15:58:11 | Pasada 4 sobre el MP4. |
| 16:02:40 | Render definitivo y verificación final. |
| 16:03:59 | Este documento escrito. |

**Total: 43 min 52 s**, de la primera orden al documento terminado.

Tiempos de máquina, medidos con `time` en 4 núcleos: sintetizar la pista
1,4 s; todo el proceso (síntesis, 900 fotogramas, unión y verificación) entre
71 y 78 s.

# Segunda parte: POIRIER, y los dos juntos

## Qué se pidió y cómo lo entendí

«Otro para mi apellido, y que se puedan mezclar.» Lo resolví con dos archivos:

- **`poirier.mp4`**: un hermano de 15 segundos. Mismo sistema, pero se sostiene
  solo: empieza con el punto y termina en `POIRIER.`
- **`cody-poirier.mp4`**: los dos como una sola película de 30 segundos. La
  mezcla está hecha en el código, no en un editor: un único sonido de principio
  a fin, una transición animada y un final con el nombre entero.

La imagen de `cody.mp4` no se ha tocado: el flujo de vídeo es el mismo, bit a
bit. Su sonido sí se ha vuelto a codificar, por un fallo del codificador que
encontré en esta parte y que explico en «Corrección a la primera parte».

## Por qué encajan

- **La misma música.** Mismo tempo (132), misma tonalidad (Fa menor), mismos
  instrumentos y la misma forma de 33 tiempos: golpes, construcción, rotura,
  subida, silencio, drop, solos, rotura, final. Puestos uno detrás de otro, la
  rejilla de tiempos no se interrumpe.
- **La misma letra.** Cuatro letras nuevas (P, I, R, E) dibujadas con las mismas
  reglas: un solo trazo, círculos y barras. La O es la misma O.
- **El mismo tamaño.** POIRIER mide 1505 px de ancho para que sus letras tengan
  exactamente la altura de las de CODY. Por eso pueden compartir pantalla.
- **El mismo punto y los mismos cuatro colores.** CODY estalla en bermellón y
  POIRIER en cobalto: cada nombre tiene su color.

## Qué es distinto, a propósito

POIRIER no es CODY con otras letras. Siete letras no caben a una por golpe, y
repetir las mismas escenas habría sido ver el mismo vídeo dos veces. Cada
compás tiene una idea nueva dentro del mismo sistema.

| Compás | CODY | POIRIER |
| --- | --- | --- |
| 1 | Una letra gigante por golpe: C, O, D, Y. | Por sílabas, como se dice: **POI · RI · ER**. Una letra por corchea, un color por sílaba. |
| 2 | Trazo fino; cada letra engorda en su nota. | Trazo fino; el punto vuelve como pelota y bota sobre las letras. La que pisa, engorda. |
| 3 | Cortado en bandas. | Dominó: la pelota tumba la P y caen las siete, una por semicorchea. Con el bombo se levantan, y pasa una ola. |
| 4 | Estalla en piezas y una espiral las lleva al punto. | Se descolocan arriba y abajo; luego la cámara atraviesa la O. Dentro solo hay negro y el punto. |
| 5 | Drop en bermellón; el nombre crece desde el centro. | Drop en cobalto; el nombre se abre de lado, como un acordeón. |
| 6 | Un solo por letra. | Un solo por sílaba, y una ola por las siete. |
| 7 | Un muro de filas que se pliega; caen cuatro letras. | Malabares; caen siete letras. |
| 8 | `CODY.` | `POIRIER.` o, en la versión unida, el nombre entero. |

**El motivo crece con el nombre.** CODY tenía cuatro notas. POIRIER tiene siete,
agrupadas como las sílabas: Fa La♭ Do, Re♭ Fa, Mi♭ Sol. Tres sílabas, tres
acordes. Suena en los golpes del arranque, en los botes de la pelota, en la
melodía del drop y en los siete timbales del final.

**El último lanzamiento obedece a una sola gravedad.** En el compás 7 las siete
letras salen lanzadas a la vez y aterrizan una por semicorchea, en orden. No
está hecho con retrasos: cada letra sube exactamente lo necesario para tardar
lo que le toca. La altura va con el cuadrado del tiempo de vuelo, así que la P
sube 24 px y la última R sube 1164 y se sale de cuadro antes de volver.

## La unión

- **Sonido.** El sintetizador toca las dos partituras seguidas en una sola
  pasada, por la misma reverberación. La cola del último acorde de CODY sigue
  sonando debajo del arranque de POIRIER. No hay corte ni fundido.
- **Imagen.** La segunda mitad empieza en el fotograma exacto en que termina
  CODY. El punto final se traga las cuatro letras, la Y primero, en medio
  tiempo. Luego se carga y POIRIER sale de ese mismo punto, desde donde estaba.
  El punto que cerró un nombre abre el otro.
- **Final.** POIRIER aterriza en la línea de abajo y CODY cae en la de arriba
  con el último golpe, alineados a la izquierda. Termina en el nombre completo
  con su punto.
- **La primera mitad es CODY tal cual.** Mismo código, misma imagen.

Los dos archivos sueltos también se pueden pegar uno detrás de otro en
cualquier editor: van a compás. Pero el corte es seco, CODY desaparece de
golpe. Para eso está el tercer archivo.

## Qué descarté

- **Una letra por golpe.** Siete negras son casi dos compases de lo mismo.
- **Reutilizar las escenas de CODY con otra palabra.**
- **El dominó tal como salió primero.** Las letras caían a 62° y, al ser todas
  del mismo color, se fundían en una mancha blanca. Ahora caen a 50°, cada
  letra se imprime entera antes que la siguiente y lleva un filete de tinta
  alrededor que la separa de la que tiene debajo.
- **Malabares con intercambios cruzados.** La primera versión intercambiaba la
  P con la R del final, las dos I entre sí y la R con la E. A mitad de vuelo
  todas pasaban por el centro a la vez: un nudo. Ahora cada letra pasa un sitio
  a la derecha y la última R da la vuelta por arriba. Solo gira esa R.
- **Elipses de polvo cuando aterrizan las siete a la vez.** Formaban una
  cadena. Se quedan solo en los aterrizajes de una en una.
- **La palabra a 1780 px en el drop.** En el rebote se salía de cuadro. Ahora
  1660.
- **La E a peso máximo.** Los huecos entre los brazos se cerraban. Los brazos
  dejan de engordar antes.
- **El punto final entrando por la derecha, como en CODY.** No cabía: el primer
  bote caía fuera de cuadro. Aquí cae desde arriba; la R no tiene un brazo que
  estorbe, como tenía la Y.

## Qué cambió entre versiones

Fotogramas revisados en esta parte: 379.

**Antes de animar.** Un fotograma con POIRIER en todos los pesos. La E se
cerraba a peso máximo: corregido.

**Pasada 1 (171 fotogramas).** Dominó ilegible, malabares hechos un nudo, la
palabra fuera de cuadro en el drop y la cadena de elipses. Todo lo de la lista
de arriba sale de aquí.

**Pasada 2 (80 fotogramas, 40 de ellos de la versión unida).** El dominó ya se
lee. En los malabares las letras seguían estorbándose al girar todas a la vez:
ahora saltan derechas. La unión y el final con los dos nombres funcionaron a la
primera. Medí el encuadre del final sobre el fotograma: 146 px de margen a cada
lado y 380 arriba y abajo en el suelto; 141 y 146, y 193 y 192, en el unido.

**Pasada 3, sobre los MP4 ya codificados (127 fotogramas).** La imagen
aguantó la codificación sin defectos. Dos arreglos salieron de aquí. En los
malabares las dos I todavía giraban y, tumbadas, cruzaban a sus vecinas como
rayas: ya no giran. Y el sonido tenía un fallo del codificador, que es lo
siguiente.

**La música.** No hubo que rehacer la mezcla: es el mismo sintetizador con otra
partitura. Medido: POIRIER −11,2 LUFS y pico real de −2,0 dBTP; la
versión unida −11,3 LUFS y −1,9 dBTP.

## Corrección a la primera parte

En la primera parte medí un pico real de +0,4 dBTP en el audio codificado y lo
arreglé bajando el nivel. Eso trataba el síntoma. La causa era otra: el
codificador AAC de ffmpeg sustituye parte del ruido por ruido sintético, y en
las palmas se equivocaba y metía una punta que no existe en el original. En la
versión unida una de esas puntas llegaba a fondo de escala donde el original
vale 0,23.

Lo localicé comparando, muestra a muestra, el audio decodificado con el WAV.
Probé ocho configuraciones del codificador y medí cada una. Desactivar esa
sustitución (`-aac_pns 0`) elimina las puntas y además reduce el error medio.
Los tres archivos están codificados así. En `cody.mp4` la mayor desviación
bajó de 0,741 a 0,453 y el pico real quedó en −2,2 dBTP. Es un defecto que
probablemente no se oía, tapado por la propia palma, pero estaba.

## Lo que comprobé de que CODY sigue intacto

- Reorganicé el sintetizador para que toque una partitura o dos. La pista de
  CODY que genera ahora tiene el mismo SHA-256 que la de antes.
- La imagen de `cody.mp4` es la entregada: el MD5 del flujo de vídeo es el
  mismo antes y después de recodificar el sonido.
- Además rendericé CODY entero con el código nuevo para comprobar que la
  reorganización no cambiaba nada: 899 de 900 fotogramas salen idénticos bit a
  bit y el otro difiere de forma invisible (PSNR 68,6 dB).
- La primera mitad de la versión unida, comparada con `cody.mp4` fotograma a
  fotograma: PSNR medio 79,4 dB. Es la misma imagen; la diferencia es solo de
  compresión.

## Sincronía, comprobada

- El audio dentro de cada uno de los tres MP4 está desplazado **0 muestras**
  respecto a su WAV (correlación cruzada).
- Los golpes de imagen caen a menos de medio fotograma (±8,3 ms) del sonido.
  En POIRIER: primer golpe −4,5 ms, RI −3,0, ER −7,6, primer bote de la pelota
  0,0, primera ficha del dominó −7,6, todas en pie 0,0, drop +6,1, primer
  timbal −3,0, golpe final +1,5, aterrizaje del punto −3,0.
- En la versión unida: primer golpe de POIRIER −4,5 ms, su drop +6,1, golpe
  final con la caída de CODY +1,5, aterrizaje del punto −3,0.
- **La unión no tiene corte.** En `cody.mp4` los últimos 0,35 s se apagan hasta
  el silencio (−28,9 dB). En la versión unida ese mismo tramo sigue sonando
  (−25,7 dB) porque la cola no se corta, y alrededor del segundo 15 el mayor
  salto entre dos muestras seguidas es 0,0105: no hay clic.

## Lo que no pude comprobar

Lo mismo que en la primera parte: no puedo oír. La música de POIRIER y la
unión están medidas, no escuchadas.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 16:11:08 | Empiezo. |
| 16:12:55 | Las cuatro letras nuevas dibujadas y validadas en un fotograma. |
| 16:22:09 | Partitura, pista y las nueve escenas escritas. Primera hoja de contactos. |
| 16:23:22 | Pasada 1 completa. |
| 16:25:28 | Arreglos hechos. Pasada 2, incluida la versión unida. |
| 16:31:12 | Primer render de los tres archivos. |
| 16:32:02 | Pasada 3, sobre los MP4. |
| 16:34:12 | Fallo del codificador de audio localizado y medido. |
| 16:38:26 | Render definitivo de POIRIER y de la versión unida. |
| 16:40:36 | Verificación final de los tres archivos. |
| 16:41:15 | Este documento escrito. |

**Total de la segunda parte: 30 min 7 s**, del encargo al documento terminado.
Sumado a la primera (43 min 52 s): 1 h 13 min 59 s de trabajo.

Tiempos de máquina, medidos con `time` en 4 núcleos: el proceso completo (síntesis, render,
unión y verificación) tarda entre 70 y 74 s para cada pieza de 15 segundos y
entre 140 y 145 s para la de 30.

# Tercera parte: LUMEN, sin palabras

## Qué se pidió y cómo lo entendí

«Otro, con un estilo distinto y sin palabras.» Mantuve todas las reglas del
primer encargo: solo código, música sintetizada desde cero, 1920×1080, 60 fps,
15 segundos exactos, revisar fotogramas al menos dos veces y dejarlo escrito
aquí con el tiempo medido.

«Distinto» lo tomé en serio. No es CODY sin letras: cambia el material, el
espacio, el color, el montaje y la canción. `lumen` es solo el nombre del
archivo. En pantalla no hay texto en ningún momento.

## La idea

Una sola: **una nube de 170.000 puntos de luz que no deja de convertirse en
otra cosa.**

Cada punto tiene un sitio fijo en una hoja imaginaria, y cada forma es una
manera de doblar esa hoja: esfera, anillo, nudo, hélice, galaxia, túnel. Como
los puntos son siempre los mismos y conservan a sus vecinos, las formas no se
sustituyen unas a otras: se pliegan una en la siguiente. Todo el vídeo es un
solo plano, sin un corte.

## En qué se diferencia de los otros dos

| | CODY y POIRIER | LUMEN |
| --- | --- | --- |
| Material | Trazos planos, tinta sobre papel | Puntos de luz en el vacío |
| Espacio | Plano | Tres dimensiones, con cámara y enfoque |
| Color | Cuatro tintas opacas | Luz que se suma: menta y violeta, y un rosa guardado para el drop |
| Montaje | Un corte por compás | Un solo plano |
| Sombreado | Ninguno | Sale solo: donde se apilan puntos, la luz se quema hacia el blanco |
| Desenfoque de movimiento | Descartado | Real, y es parte del aspecto |
| Música | Fa menor, bombo en cada tiempo | Fa mayor, medio tiempo |

## Qué elegí y por qué

**Luz acumulada, no formas dibujadas.** No hay ni un círculo ni una línea
trazados. En cada fotograma se coloca cada punto en 3D, se proyecta, y su luz
se suma en una imagen de coma flotante que luego se «revela» con una curva de
película. Un punto solo apenas se ve; mil alineados en el borde de una esfera
dan un filo brillante. Por eso las formas parecen de cristal sin que nadie las
haya sombreado.

**Una hoja con una rejilla dibujada.** El 26 % de los puntos están sobre 18
meridianos y 12 paralelos de la hoja; el resto es polvo. La rejilla viaja con
la hoja: en la esfera es un globo, en el anillo son costillas, en el nudo son
aros, en la hélice son los bordes de las cintas, en la galaxia se enrolla en
hilos espirales y en el túnel son los aros que pasan volando. Es lo que hace
que se lea el plegado, y que una esfera de polvo quieta no parezca un disco.

**Puntos repartidos sin azar.** Una secuencia de baja discrepancia en vez de
números aleatorios: sin grumos ni calvas, y con el mismo número de puntos la
superficie queda mucho más limpia.

**Tres colores.** Menta (≈ `#34F3C4`) y violeta (≈ `#7B4CFF`), repartidos de
un extremo a otro de la hoja, sobre un fondo casi negro que azulea en el
centro. El blanco no es un color aparte: es lo que pasa cuando se suma mucha
luz. El tercero, un rosa (≈ `#FF6FAC`), no existe hasta el drop: en ese golpe
uno de cada diez puntos se enciende en rosa, y se apaga antes del final. El
momento grande tiene un color que el resto del vídeo no tiene.

**Una cámara de verdad.** Profundidad de campo (lo que se acerca o se aleja
del plano de enfoque se abre en discos blandos), obturador abierto el 60 % del
fotograma (lo que se mueve deja estela, hasta 18 muestras por punto), halo
alrededor de lo muy brillante y exposición automática: cuando los 170.000
puntos caben en diez píxeles, el diafragma se cierra para no quemar la
pantalla. En los tres estallidos se abre a propósito.

**Peso, golpe y rebote, también en una nube.** Todo va con muelles en segundos
reales, y cada punto sale un poco antes o después que su vecino, así que las
formas se propagan en vez de moverse en bloque. Cada bombo hincha la nube y la
deja resonar; como el salto ocurre con el obturador abierto, el fotograma del
golpe sale barrido desde el centro. Cada caja la ladea de un tirón y manda una
onda esférica hacia fuera.

**Una sola partitura para imagen y sonido, otra vez.** `src/score-lumen.ts`
tiene cada bombo, caja, redoble, timbal y nota. El sintetizador y la imagen
leen las mismas listas. Mantuve 132 pulsos por minuto: 15 segundos siguen
siendo 33 tiempos, uno de anacrusa y ocho compases.

**Otra canción con los mismos instrumentos.** Fa mayor en vez de Fa menor.
Medio tiempo: bombo en el uno, caja en el tres. Un acorde por compás, Re
menor, Si bemol, Fa y Do suspendido en la subida; Si bemol, Re menor, Do y Fa
en el drop, que termina resuelto y luminoso. Semicorcheas punteadas de
principio a fin, que en imagen son el centelleo: en cada una se enciende un
3 % distinto de los puntos. La melodía es pentatónica y va sobre el ritmo del
bombo. Añadí un instrumento al sintetizador, un colchón de acordes de ataque
lento, que los otros dos vídeos no usan.

**Estructura.**

| Tiempo | Compás | Qué pasa |
| --- | --- | --- |
| 0,00 s | anacrusa | Un cielo de polvo cae en espiral hacia un punto. El polvo más cercano llega primero y enciende el centro. |
| 0,45 s | 1 | El punto revienta y es una esfera. |
| 2,27 s | 2 | Los dos polos se hunden hasta atravesarla: es un anillo. La caja lo ladea. |
| 4,09 s | 3 | Rotura. Con el bombo estalla en polvo, queda suspendido, y cae como limaduras a un imán: en el bombo siguiente es un nudo de trébol. |
| 5,91 s | 4 | El nudo se desata en una doble hélice. Cada golpe del redoble la encoge un paso, hasta un punto. Medio tiempo de silencio: solo el punto. |
| 7,73 s | 5 y 6 | **El momento grande.** El punto estalla y deja una galaxia. Aparece el rosa. Cada bombo manda un anillo por el disco; en el compás 6 la cámara baja y lo roza. |
| 11,36 s | 7 | El disco se hunde en un embudo y volamos por el túnel. Los cuatro timbales lo cierran en cuatro pasos, hasta un punto. |
| 13,18 s | 8 | Último golpe: el punto estalla otra vez y es la esfera del principio. Tres notas, tres bandas de luz de polo a polo. Quieta. |

## Qué descarté

- **WebGL.** Habría sido mucho más rápido, pero depende de la tarjeta y del
  navegador. Calculado en la CPU, píxel a píxel, el resultado es exacto: el
  mismo fotograma renderizado fuera del navegador y dentro de Chrome sale con
  0 píxeles distintos.
- **Estelas acumulando el fotograma anterior.** Los fotogramas se renderizan
  en paralelo y desordenados; cada uno tiene que salir solo de su número. El
  desenfoque se calcula colocando cada punto dos veces, al abrir y al cerrar
  el obturador.
- **Rosa espolvoreado por todas partes.** La primera versión lo llevaba en
  todas las escenas y parecía confeti. Guardado para el drop.
- **Muelles con rebote para viajes largos.** Un rebote del 16 % es bonito
  cuando un punto se mueve un palmo y es borrón cuando viene de dos pantallas
  más allá. Donde el viaje es largo, los puntos aceleran hacia su sitio y se
  clavan en seco justo en el tiempo; el rebote lo pone la forma entera.
- **Los peldaños de la hélice.** La primera hélice era un ADN con peldaños.
  Los que apuntaban a la cámara se estiraban por la perspectiva y parecían
  rayas sueltas. Fuera: dos cintas con sus bordes.
- **La esfera final saliendo directamente del túnel.** Los puntos del fondo
  del túnel venían de muy lejos y un segundo después del golpe todavía no
  habían llegado: la esfera aparecía con un plato cruzado. Ahora el túnel se
  cierra del todo en un punto y la esfera sale de él, igual que al principio.
- **Una escena más entre la galaxia y el túnel** (una sábana ondulante). Era
  una forma de más. La galaxia se queda dos compases y cambia la cámara.
- **Otro tempo.** A 132 la rejilla ya estaba probada en los otros dos.
- **La compresión de los otros vídeos (CRF 16).** Ver abajo: 53,4 MB.

## Qué cambió entre versiones

Fotogramas revisados en esta parte: 365, en hojas de contacto y recortes a
tamaño real.

**Pasada 1 (56 fotogramas: los primeros de prueba y toda la línea de tiempo).**
El aspecto funcionó a la primera. La coreografía no:
- El compás 1 era una esfera de polvo quieta durante casi dos segundos. De
  aquí salió la rejilla, y que cada forma se acerque un poco mientras dura.
- La apertura era un disco gris que encogía. Ahora cae primero el polvo
  cercano y las colas siguen llegando en espiral.
- El núcleo de la galaxia tenía una aguja vertical: el bulbo estaba mal
  repartido. Rehecho.
- El túnel era un agujerito en el centro. Lo acorté de 15 a 10 unidades.
- El aterrizaje final, el plato cruzado de más arriba.
- El punto del silencio casi no se veía. Subí el mínimo de la exposición.
- El drop tardaba: el muelle pasó de 1,9 a 3,2 Hz. En cuatro fotogramas ya
  está al 60 % del tamaño.

**Entre pasadas (49 fotogramas).** Los tres estallidos iluminan el cielo y
abren el halo. El nudo dejó de llegar borroso (el imán). Comprobé que Remotion
y el render directo dan la misma imagen.

**Pasada 2 (75 fotogramas, uno de cada doce) y sus arreglos (21 más).**
- Las rayas sueltas de la hélice. Hice dos pruebas para saber qué eran: sin
  peldaños desaparecían, sin restos de la transición seguían. Eran los
  peldaños vistos de punta.
- La hélice se salía por arriba: de 2,7 a 2,4 de alto, y la transición con
  menos rebote.
- En la bajada de cámara el borde del disco quedaba en mitad del cuadro y el
  tercio inferior en negro. Probé a bajarlo mucho y la galaxia se quedó en una
  raya; el término medio es el que está.
- La esfera final tocaba el borde del cuadro al rebotar: algo más pequeña y
  con algo menos de rebote.

**Pasada 3, sobre el MP4 codificado (100 fotogramas consecutivos alrededor de
cada golpe y 6 recortes de compresión).**
- Todos los golpes caen en el fotograma calculado.
- El anillo de cada bombo levantaba el núcleo de la galaxia como un
  salpicón. Ahora el anillo nace fuera del núcleo.
- Medí el centelleo en el brillo medio de cada fotograma: un diente de sierra
  cada semicorchea, pero de solo un 1 % en el primer compás. Reforzado.
- El archivo pesaba 53,4 MB: polvo en movimiento es lo más caro que se le
  puede dar a un codificador. Probé más compresión sobre los fotogramas
  difíciles. A CRF 23 (20 MB) el polvo se volvía pasta. A CRF 20 con ajuste
  lento aguanta: 31,8 MB.

**Pasada 4, sobre el MP4 definitivo (46 fotogramas y 3 recortes a tamaño
real).** Nada que arreglar.

**La música.** Salió equilibrada a la primera porque la mezcla ya estaba
hecha: −11,5 LUFS, 5,1 LU de rango, pico real de −1,8 dBTP dentro del MP4. El
medio tiempo de silencio antes del drop queda 46,7 dB por debajo del drop.

## Sincronía, comprobada

- El audio dentro del MP4 está desplazado **0 muestras** respecto al WAV
  (correlación cruzada).
- Los tres estallidos y el aterrizaje del nudo, medidos sobre el archivo
  final: el brillo medio salta en los fotogramas 27, 286, 464 y 791, que son
  los calculados.
- Cada golpe de imagen cae a menos de medio fotograma (±8,3 ms) del sonido:
  primer estallido −4,5 ms, anillo −6,1, rotura −7,6, nudo −6,1, hélice +7,6,
  drop +6,1, bajada de cámara +4,5, embudo +3,0, los cuatro timbales +6,1,
  −7,6, −4,5 y −1,5, último estallido +1,5, las tres notas finales −3,0, +3,0
  y +6,1.
- Un matiz honesto: cuando un bombo cae con el obturador abierto, el barrido
  aparece ya en ese fotograma, que puede ser el anterior al de la lista. Es
  lo que haría una cámara.

## Lo que comprobé de que los otros tres siguen intactos

Para añadir el colchón de acordes y una entrada sin el «punto que cae» toqué
el sintetizador. Las pistas de CODY, POIRIER y la unión que genera ahora
tienen el mismo SHA-256 que antes de tocarlo. Sus MP4 no se han regenerado.

## Lo que no pude comprobar

Lo mismo que en las otras dos partes: no puedo oír. Esta canción es nueva
(tonalidad, ritmo, acordes y melodía) y está medida, no escuchada. Elegí
armonía y melodía conservadoras a propósito, todo dentro de la pentatónica de
Fa, para que no pueda haber una nota que choque. Si algo no gusta al oído,
está en `src/score-lumen.ts` y se cambia en una línea.

Tampoco se puede ver a tiempo real en Remotion Studio: cada fotograma tarda
un tercio de segundo en calcularse. Para verlo moverse hay que renderizarlo.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 10:21:42 | Empiezo. |
| 10:26:29 | Partitura nueva escrita. Huella de las tres pistas anteriores tomada antes de tocar el sintetizador. |
| 10:33:15 | Pista sintetizada y medida. Motor de render escrito. Primeros fotogramas. |
| 10:34:23 | Pasada 1: toda la línea de tiempo. |
| 10:37:01 | Primera tanda de arreglos. |
| 10:39:50 | Composición de Remotion hecha; su imagen es idéntica a la del render directo. |
| 10:40:45 | Pasada 2. |
| 10:43:45 | Hélice y encuadres corregidos. |
| 10:46:31 | Primer render completo: 2 min 39 s, 53,4 MB. |
| 10:51:30 | Pasada 3, sobre el MP4. |
| 10:55:25 | Render definitivo: 2 min 31 s, 31,8 MB. |
| 10:56:28 | Verificación final y pasada 4. |
| 10:58:56 | Este documento escrito. |

**Total de la tercera parte: 37 min 14 s**, del encargo al documento terminado.
Sumado a las dos primeras (1 h 13 min 59 s): 1 h 51 min 13 s de trabajo.

Tiempos de máquina, medidos con `time` en 4 núcleos: sintetizar la pista
1,4 s; un fotograma entre 0,27 y 0,60 s; el proceso completo (síntesis, 900
fotogramas, unión y verificación) 2 min 31 s, el doble que los otros porque
aquí cada píxel se calcula.

# Cuarta parte: SPLASH, pintura

## Qué se pidió y cómo lo entendí

«¿Puedes hacer uno mejor, de otro estilo, con imágenes más vibrantes y
enérgicas?» Venía de LUMEN, así que lo leí como: otra vez sin palabras, y lo
contrario de LUMEN en todo lo que lo hacía tranquilo. LUMEN es oscuro, fino,
de un solo plano y a medio tiempo. Este es claro, grueso, cambia de color en
cada golpe y lleva el bombo en todos los tiempos. Las reglas del primer
encargo siguen en pie: solo código, música sintetizada, 1920×1080, 60 fps,
15 segundos exactos, fotogramas revisados y tiempo medido.

`splash` es solo el nombre del archivo. En pantalla no hay texto.

**Sobre «mejor».** Eso no lo puedo certificar yo; lo decide quien lo mira. Lo
que sí puedo decir es qué intenté mejorar respecto de LUMEN, en concreto:

| | LUMEN | SPLASH |
| --- | --- | --- |
| Brillo medio de la imagen (0 a 255) | 45 | 134 |
| Saturación media del color (misma escala de `ffmpeg`) | 9 | 85 |
| Ritmo | Medio tiempo: una caja por compás | Bombo en cada tiempo; 13 cambios de color de pantalla entera |
| Material | Polvo fino, que la compresión castiga | Formas grandes de color plano |
| Peso del archivo | 31,8 MB con compresión más fuerte | 17,1 MB con la compresión de CODY |
| Final | Una esfera que sigue girando | Una gota quieta: los últimos 0,78 s no se mueve nada |

## La idea

Una sola: **todo es pintura espesa.**

Una única materia. Gotas brillantes que al acercarse se funden y al separarse
dejan un cuello que se rompe. El fondo también es pintura: en cada golpe
fuerte un color nuevo inunda la pantalla desde un punto, y el color que había
queda debajo.

## Qué elegí y por qué

**Metabolas, no formas.** Cada gota suma a un campo invisible y la pintura está
donde ese campo supera un umbral. Por eso dos gotas que se acercan se buscan y
se unen solas, sin que nadie dibuje la unión. El color se promedia según lo
que aporta cada gota: donde se tocan dos colores se mezclan como pintura
fresca.

**Brillo de esmalte.** Si fueran manchas planas, esto sería CODY otra vez. La
superficie se redondea en los últimos 58 px antes del borde, la luz viene de
arriba a la izquierda, hay dos brillos (uno ancho y otro fino, que es el que
la hace parecer mojada) y cada capa proyecta sombra sobre la de abajo.

**Cinco colores a todo volumen.** Rosa `#FF267A`, naranja `#FF7E14`, amarillo
`#FFD60A`, cian `#14CEFF` y violeta `#7C3AFF`. Cualquiera puede ser fondo y
cualquiera puede ser gota. Hay un azul noche, `#180C42`, que solo aparece en el
compás 4 y en el silencio, para que el drop tenga de dónde salir, y blanco
solo en gotas pequeñas.

**Una regla de color.** La gota protagonista lleva siempre el color de la
siguiente inundación: revienta, y ese color se queda con la pantalla.

**Tres capas de pintura.** Inundaciones al fondo, gotas lanzadas encima y los
cuerpos arriba. Dentro de una capa todo se funde; entre capas hay sombra.

**Peso, golpe y rebote.** Muelles en segundos reales. Lo que aterriza se
aplasta, lo que vuela se estira, y las gotas lanzadas se alargan según su
velocidad, que aquí hace el trabajo del desenfoque. Los cuerpos tiemblan como
gelatina después de cada golpe y se quedan redondos.

**Una canción nueva, con la forma de CODY.** La menor: La menor, Fa, Do, Sol.
Cuatro acordes, y en el primer compás cuatro colores, uno por acorde. Vuelve
el bombo en los cuatro tiempos porque es lo que empuja. La melodía es
pentatónica. Mismos instrumentos, misma partitura compartida entre sonido e
imagen (`src/score-splash.ts`), mismos 132 pulsos por minuto. Los barridos de
subida del sintetizador estaban afinados en Fa; ahora se afinan con la pieza.

**Estructura.**

| Tiempo | Compás | Qué pasa |
| --- | --- | --- |
| 0,00 s | anacrusa | Una gota rosa se encoge y tiembla mientras absorbe gotas de alrededor. |
| 0,45 s | 1 | Cuatro golpes, cuatro inundaciones: rosa, cian, amarillo, violeta. La gota salta a un sitio nuevo y revienta en cada uno. |
| 2,27 s | 2 | La gota va de un lado a otro, un salto por bombo. Las palmas le arrancan un anillo de gotas; cinco campanas, cinco burbujas amarillas. |
| 4,09 s | 3 | Inundación cian. Una gota se divide en dos, cuatro, ocho, una división por tiempo. |
| 5,91 s | 4 | El corro de ocho gira cada vez más rápido. Cada golpe del redoble lo encoge y cierra la oscuridad un paso. Queda una perla blanca. Medio tiempo de silencio. |
| 7,73 s | 5 | **El momento grande.** La perla estalla en 90 gotas. Un color nuevo por tiempo, entrando desde una esquina. La gota bota con cada bombo y lanza un brazo con cada nota. |
| 9,55 s | 6 | La gota se zambulle y suben siete columnas de pintura: un ecualizador líquido. Cada nota de la melodía hace saltar una. |
| 11,36 s | 7 | Un molinillo de cuatro brazos. Los cuatro timbales los recogen de uno en uno en una bola de cuatro colores. |
| 13,18 s | 8 | Último golpe: amarillo, y la bola es una sola gota rosa. Tres notas, tres gotas que le caen encima. Tiembla, se asienta, quieta. |

## Qué descarté

- **Otro fondo oscuro con brillos** (neón, rejillas, láser). Habría sido LUMEN
  con otra ropa.
- **Gotitas pegadas al cuerpo para hacerlo temblar.** Parecían verrugas. El
  temblor lo hacen tres lóbulos grandes por dentro, que en reposo se quedan en
  el centro.
- **Ninguna gota pequeña dentro de una grande de su misma capa.** El sombreado
  la lee como un borde y sale un hoyuelo. De ahí la capa propia para las gotas
  lanzadas.
- **Un remolino de 28 gotas sueltas.** Sopa de confeti. Ahora es un molinillo
  de cuatro brazos, un color por brazo.
- **Gotas blancas que subían y volvían a caer en el compás 6.** Siempre había
  dos en el aire a la misma altura: parecían un par de ojos. Ahora salen por
  arriba y no vuelven, con el color de su columna.
- **Un brazo en la primera nota del drop.** La gota parecía una bomba con
  mecha. Ese instante es del estallido.
- **Fundidos de color de dos o tres fotogramas en los golpes.** A medio camino
  entre dos colores vivos hay un gris. Los cambios en los golpes son de un
  fotograma.
- **Gotas rosas en el último estallido.** Junto a la gota rosa final parecían
  bultos suyos.
- **Inundaciones que nacen pequeñas.** Ver «Sincronía»: nacían tapadas por la
  gota y se veían un fotograma tarde.
- **Desenfoque de movimiento y WebGL.** Por lo mismo que en LUMEN: cada
  fotograma sale solo de su número y el resultado es exacto.

## Qué cambió entre versiones

Fotogramas revisados en esta parte: 512.

**Pasada 1 (80 fotogramas: toda la línea de tiempo y recortes a tamaño real).**
El aspecto salió a la primera: brillo, sombra y mezcla de colores. Fallaba la
coreografía: las verrugas, el remolino de confeti, las gotas que nacían en el
centro del cuerpo en vez de en su borde, la oscuridad del compás 4 que solo
llegaba en el último medio tiempo, y gotas sueltas todavía en pantalla en el
plano final.

**Pasada 2 (111 fotogramas, uno de cada doce y los arreglos).**
- Las gotas lanzadas se fundían con los cuerpos y los deformaban. Tercera capa.
- Hoyuelos en la gota final: los lóbulos del temblor se hacían pequeños antes
  de desaparecer. Ahora no encogen nunca, y en el render siguiente los
  hoyuelos ya no estaban.
- El corro de ocho estaba quieto demasiado tiempo. Ahora las gotas pares e
  impares saltan en sentidos opuestos con cada golpe del redoble.
- La zambullida del compás 6 pasaba por delante de las columnas. Ahora por
  detrás.

**Pasada 3, sobre el MP4 codificado (210 fotogramas, 180 de ellos
consecutivos alrededor de cada golpe).** De aquí salieron los ojos, la mecha,
los dos fotogramas grises y los bultos rosas de la lista de arriba. También:
cada división del compás 3 lanza gotas del color de las hijas, y el brazo rosa
del molinillo, que desaparecería sobre la inundación rosa, se vuelve cian
justo por donde la inundación lo alcanza.

**Lo que encontró la medición, no el ojo (18 fotogramas para comprobarlo).**
Medí el color medio de cada fotograma del MP4 para ver en cuál empieza cada
inundación. Cuatro de las trece empezaban a verse un fotograma tarde: el color
nuevo nacía con unos 94 px de radio, escondido detrás de la gota. Ahora nace
con 240. Y la gota final no llegaba a estar quieta: los lóbulos se retiraban de
golpe a los 14,7 s. Ahora se quedan dentro, sin moverse.

**Pasada 4, sobre el MP4 definitivo (93 fotogramas, incluidos los de cada
golpe y 3 recortes a tamaño real).** Nada que arreglar. Los bordes y los
brillos aguantan la compresión sin defectos.

**La música.** −11,4 LUFS, 5,1 LU de rango y pico real de −2,0 dBTP dentro del
MP4. El medio tiempo de silencio antes del drop queda 47,1 dB por debajo del
drop, y el ataque del drop cae a 0,04 ms de la rejilla.

## Sincronía, comprobada

- El audio dentro del MP4 está desplazado **0 muestras** respecto al WAV.
- **Las 13 inundaciones** empiezan en el fotograma calculado, medido sobre el
  archivo final: 27, 55, 82, 109, 245, 464, 491, 518, 545, 573, 682, 736 y
  791. En cada uno el color medio de la imagen salta al menos el triple que
  en los dos fotogramas anteriores.
- Cada una cae a menos de medio fotograma (±8,3 ms) de su sonido: −4,5, +7,6,
  +3,0, −1,5, −7,6, +6,1, +1,5, −3,0, −7,6, +4,5, +3,0, −6,1 y +1,5 ms.
- En el silencio (fotogramas 451 a 463) la imagen no cambia.
- **El final está quieto de verdad.** Desde el fotograma 853 (14,22 s) el
  color medio no varía ni 0,05 sobre 255: 0,78 s de imagen inmóvil.
- El mismo fotograma renderizado por Remotion en Chrome y directamente desde
  el motor sale con 0 píxeles distintos.

## Lo que comprobé de que los otros cuatro siguen intactos

Toqué el sintetizador para que los barridos de subida se afinen con cada
pieza. Las pistas de CODY, POIRIER, la unión y LUMEN que genera ahora tienen
el mismo SHA-256 que antes. Sus MP4 no se han regenerado, y el código de LUMEN
no se ha tocado. Solo cambió de nombre la herramienta de fotogramas, que ahora
sirve a las dos piezas: `scripts/stills.ts`.

## Lo que no pude comprobar

No puedo oír. Esta canción también es nueva y está medida, no escuchada. Usé
la misma precaución que en LUMEN: armonía de cuatro acordes muy probada y
melodía dentro de la pentatónica de La menor.

Y lo dicho arriba: si es «mejor» lo decide quien lo ve. Yo puedo responder de
que es más luminoso, más saturado y tiene más golpes por segundo, porque eso
se mide.

Como LUMEN, no se ve a tiempo real en Remotion Studio: hay que renderizarlo.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 12:00:04 | Empiezo. Huella de las cuatro pistas anteriores tomada antes de tocar el sintetizador. |
| 12:00:59 | Partitura nueva escrita; acto seguido, pista sintetizada y medida. |
| 12:05:44 | Motor de pintura y coreografía escritos. Pasada 1: toda la línea de tiempo. |
| 12:07:51 | Primera tanda de arreglos. |
| 12:09:23 | Pasada 2. |
| 12:12:41 | Hoyuelos localizados y eliminados. |
| 12:15:32 | Primer render completo: 2 min 28 s, 16,7 MB. |
| 12:16:03 | Pasada 3, sobre el MP4. |
| 12:19:58 | Arreglos de la pasada 3. |
| 12:22:15 | Segundo render completo. |
| 12:25:07 | Medición del MP4: cuatro inundaciones un fotograma tarde y un final que no se detenía. Arreglado y comprobado. |
| 12:27:48 | Render definitivo: 2 min 16 s, 17,1 MB. Verificación final. |
| 12:28:46 | Pasada 4, sobre el MP4 definitivo. |
| 12:31:10 | Este documento escrito. |

**Total de la cuarta parte: 31 min 6 s**, del encargo al documento terminado.
Sumado a las tres primeras (1 h 51 min 13 s): 2 h 22 min 19 s de trabajo.

Tiempos de máquina, medidos con `time` en 4 núcleos: sintetizar la pista
2,0 s; un fotograma entre 0,12 y 0,40 s; el proceso completo (síntesis,
900 fotogramas, unión y verificación) entre 2 min 14 s y 2 min 28 s.

# Quinta parte: COSMOS, a partir de un vídeo de referencia

## Qué se pidió y cómo lo entendí

Un vídeo de referencia y la petición de hacer uno de estilo parecido, con otro
tema a mi elección, usando solo lo que tengo a mano.

**Qué es la referencia, medido.** La miré entera: 184 fotogramas, uno por
segundo, y medí su sonido.

- Vertical, 720×1280, 30 fps, 3 min 4 s.
- La misma composición todo el rato: fondo negro; arriba, la cabecera de una
  cuenta (avatar, nombre, usuario) y un pie de foto de dos líneas; en el
  centro, una franja de imagen panorámica (de la fila 438 a la 872); abajo,
  negro vacío.
- Montaje de tráiler: un plano nuevo cada uno o dos segundos, en orden
  cronológico (de la creación al apocalipsis), con destellos en los golpes.
- Imágenes de aspecto pictórico, iluminación dramática y grano: están hechas
  con generadores de imagen y vídeo por IA.
- La música es épica, de tráiler: medí unos 150 pulsos por minuto, −14,1 LUFS,
  16 LU de rango (partes muy bajas y partes muy altas), dos tramos en calma y
  golpes graves agrupados en los clímax.

**Qué tomé de ella:** el formato vertical y su composición, el montaje
cronológico de «toda una historia en un vídeo», el aire de tráiler (grano,
destellos, golpes, partes en calma antes de los clímax) y la forma de la
música.

**Qué no tomé, a propósito:**
- **Su marca.** Ni el nombre de la cuenta, ni el usuario, ni la insignia de
  verificado, ni la marca de agua de Instagram. La cabecera es tuya: un
  emblema dibujado en código, tu nombre y «a film made entirely in code».
- **Los generadores de IA.** Lo entendí como «con tus herramientas», y las
  mías son las de todo este trabajo: código. Además, era la regla del primer
  encargo. En esta sesión hay conectores que generan imagen y vídeo, pero
  gastan créditos de tu cuenta y no los usé sin preguntarte.
- **La duración.** Un minuto en vez de tres. Cada plano se calcula píxel a
  píxel; prefiero dieciséis planos cuidados a cuarenta de relleno. Si quieres
  los tres minutos, la estructura lo admite: son más entradas en una lista.

**El tema: la historia del universo.** Tiene lo mismo que hace funcionar a la
referencia (una historia enorme, contada en orden, con momentos espectaculares)
y se puede pintar entero con matemáticas: luz, fuego, gas, planetas, agua.

## La idea

Una sola: **13.800 millones de años en un minuto, del punto al punto.**

Empieza con un punto de luz en la oscuridad y termina con la Tierra alejándose
hasta ser un punto de luz azul. Entre medias, dieciséis planos en orden, cada
uno con su fecha debajo.

| Tiempo | Plano | Qué se ve |
| --- | --- | --- |
| 0,0 s | Antes del tiempo | Polvo en espiral cayendo hacia un punto que late. Medio tiempo de silencio. |
| 4,8 s | El Big Bang | Destello blanco. Fuego que sale hacia la cámara, se enfría y queda en brasas. |
| 9,6 s | Las primeras estrellas | Oscuridad; once estrellas se encienden una a una e iluminan el gas. |
| 12,8 s | Las galaxias | 60.000 estrellas que se enrollan en una espiral. |
| 17,6 s | Mueren estrellas | Una gigante roja hierve, se hunde y estalla en una nube de colores con su onda de choque. |
| 20,8 s | Nace el Sol | Un disco de polvo con los huecos que abren los planetas al formarse. |
| 24,0 s | La Luna | La Tierra fundida. Un planeta entra por la esquina, choca y la escupe en un chorro de roca. |
| 28,8 s | Los primeros océanos | Tormenta sobre el mar; los rayos iluminan nubes y olas. |
| 32,0 s | La vida | Una célula que se divide en dos, cuatro, ocho, bajo rayos de luz en el agua. |
| 38,4 s | Los primeros bosques | Amanecer; los árboles crecen rama a rama. |
| 41,6 s | El asteroide | Dos dinosaurios de cuello largo entre helechos arborescentes. Un meteoro cruza el cielo y cae tras el horizonte. |
| 44,8 s | El fuego | Dos personas sentadas junto a una hoguera bajo la Vía Láctea. |
| 48,0 s | Las ciudades | La Tierra de noche, y las luces encendiéndose por todo el planeta. |
| 51,2 s | Al espacio | Un cohete despega y la cámara sube con él. |
| 54,4 s | Hoy | La Tierra iluminada, alejándose hasta ser un punto. |
| 57,6 s | Fin | El último golpe. COSMOS. |

## Qué elegí y por qué

**Un motor de render propio, sin imágenes.** La referencia tiene aspecto de
cuadro o de película; el código no puede imitar eso dibujando formas planas.
Escribí un pequeño motor (`src/cosmos/engine.ts`) que hace lo que haría una
cámara: suma luz en coma flotante, con ruido fractal para el gas, el fuego,
las nubes y el agua; esferas iluminadas para los planetas; siluetas
antialias para los árboles, los dinosaurios, las personas y el cohete; y luego
la «película»: resplandor, destello horizontal de lente, una curva de
exposición de cine, sombras frías y luces cálidas, viñeta y grano. Cada
fotograma sale solo de su número.

**El formato de la referencia, en limpio.** 1080×1920 (la misma proporción
que 720×1280, con más resolución) a 30 fps. Cabecera, pie de dos líneas, la
franja de imagen en el mismo sitio, a escala. El negro de abajo, que en la
referencia queda vacío, aquí lleva la fecha de cada plano y una línea de
progreso que recorre los 13.800 millones de años.

**El montaje, en la música.** 150 pulsos por minuto, como medí en la
referencia: un tiempo dura 0,4 s, exactamente 12 fotogramas. Todos los cortes
y golpes caen en fotogramas enteros, sin redondeo. Los planos duran entre 8 y
16 tiempos (3,2 a 6,4 s), más largos que en la referencia porque aquí la
imagen se mueve dentro del plano.

**Una canción nueva con la forma de la referencia.** Re menor, tráiler: un
zumbido que se carga, el golpe del Big Bang, campanas en calma (una por cada
estrella que se enciende), un crescendo hasta la supernova, el choque de la
Luna, truenos en los rayos de la tormenta, un tramo tranquilo para la vida,
el asteroide, tambores en cada tiempo desde el fuego hasta el cohete, una
melodía que sube y, al final, un acorde en Re mayor. Medido: −13,9 LUFS
dentro del MP4 (la referencia, −14,1) y 12,1 LU de rango (la referencia, 16).

**Los mismos instrumentos, otra forma.** El sintetizador estaba hecho para la
forma de 33 tiempos de los títulos. Le añadí una segunda forma, «película»,
en la que solo manda la partitura, incluidos los niveles, más un instrumento
nuevo: el trueno. Las cinco pistas anteriores salen idénticas bit a bit.

**Texto con una fuente del sistema.** Las piezas anteriores dibujaban sus
letras como trazos. Esta tiene que escribir frases, así que usa Inter, que
está instalada en esta máquina. No se descargó ningún archivo de fuente. En
otra máquina sin Inter saldría con la fuente sans del sistema.

## Qué descarté

- **Copiar la cabecera de la referencia tal cual.** Era la marca de otra
  persona.
- **Usar generadores de imagen o vídeo.** Ver arriba.
- **Tres minutos.** Ver arriba.
- **Helechos de espina de pescado.** La primera versión del plano de los
  dinosaurios eran tallos con hojitas rectas: parecían raspas. Ahora son
  helechos arborescentes, con tronco y una corona de frondas que se arquean.
- **Árboles sin nada delante en el plano del asteroide.** Sin dinosaurios, el
  plano no decía «hace 66 millones de años» hasta leer la fecha. Con ellos, sí.
- **Dos rayas en el cielo del fuego.** La primera Vía Láctea tenía una franja
  oscura muy marcada y parecía dos focos. Ahora es una sola banda suave.
- **Personas como tubos.** Las primeras siluetas junto al fuego parecían
  morteros. Ahora están sentadas, encorvadas, con los brazos en las rodillas.

## Qué cambió entre versiones

Fotogramas revisados en esta parte: 304 propios, más 184 de la referencia.

**Pasada 1 (90 fotogramas, toda la línea de tiempo dos veces).** La primera
hoja salió casi toda negra: un error en el motor vaciaba las capas borrosas
(gas, fuego, niebla) antes de sumarlas. Arreglado, salió el resto:
- El polvo del principio no se veía. El Big Bang y el gas de las primeras
  estrellas llenaban la pantalla de un color plano. La galaxia era un óvalo
  beis: el brillo difuso tapaba los brazos. La supernova, una niebla rosa.
- Dos formas oscuras raras. Las investigué en tamaño real: una era un hueco
  en los escombros del choque (ningún fragmento salía más despacio que un
  mínimo) y la otra, la cara nocturna de la Tierra. Arreglado.
- Los helechos no aparecían. Probé las funciones de dibujo por separado y
  funcionaban; el fallo era el helecho: cada tramo sumaba su curva a la del
  anterior y se enroscaba hacia el suelo antes de asomar.
- El fuego no tenía llama, las ciudades eran continentes dorados y la llama
  del cohete casi no se veía.

**Pasada 2 (63 fotogramas, uno por segundo y la composición vertical).**
- El Big Bang seguía terminando en naranja plano. Causa: su núcleo blanco
  crecía hasta llenar el cuadro. Ahora crece un momento y se apaga, y el
  fuego se enfría hasta quedar en brasas, que enlazan con la oscuridad de las
  primeras estrellas.
- El asteroide entraba fuera de cuadro y el impacto era un cielo blanco.
  Ahora cruza el cielo con cabeza brillante y cola; tras el golpe, el polvo
  oscurece el cielo y la bola de fuego sube sobre el horizonte.
- El brillo del choque de la Luna cubría todo el planeta; los casquetes de
  hielo de la Tierra parecían tapas.

**Pasada 3, sobre el MP4 (94 fotogramas, seguidos alrededor de cada corte y
cada golpe).** Nada que arreglar. Los cinco destellos, los cortes y los
textos caen donde deben.

## Sincronía, comprobada

- El audio dentro del MP4 está desplazado **0 muestras** respecto al WAV.
- Los cinco golpes grandes (Big Bang, supernova, choque, asteroide, final):
  el brillo de la franja salta de unos 20–140 a más de 200 exactamente en los
  fotogramas calculados, 144, 576, 816, 1296 y 1728. Como un tiempo son 12
  fotogramas justos, cada uno empieza a la vez que su sonido: 0,0 ms.
- Los cuatro golpes aislados de la música caen a menos de 0,1 ms de la
  rejilla.
- De los trece cortes, doce se ven en el brillo medio justo en su fotograma.
  El que falta (galaxia → gigante roja) tiene el mismo brillo medio a los dos
  lados (43,6 y 44,0), pero el corte está ahí: se ve en las tiras de la
  pasada 3.
- El silencio antes del Big Bang queda 48,1 dB por debajo del golpe.

## Lo que comprobé de que lo anterior sigue intacto

Las cinco pistas anteriores que genera ahora el sintetizador tienen el mismo
SHA-256 que antes de tocarlo. Sus MP4 no se han regenerado.

## Lo que no pude comprobar

No puedo oír. Esta música está medida, no escuchada.

Y la referencia está hecha con IA generativa; esto está hecho con código. Se
parece en formato, montaje, ritmo y tono, no en el detalle de cada imagen: un
dinosaurio dibujado con líneas no es una pintura. Si quieres acercarte más a
ese aspecto, la vía es usar un generador. Gasta créditos, así que eso lo
decides tú.

Como LUMEN y SPLASH, no se ve a tiempo real en Remotion Studio: hay que
renderizarlo.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 16:15:07 | Empiezo. |
| 16:15:31 | Referencia entera en hojas de contacto (184 fotogramas). |
| 16:17:18 | Sonido de la referencia medido: tempo, sonoridad, forma. |
| 16:20:33 | Tema y lista de planos decididos. |
| 16:28:02 | Motor y dieciséis planos escritos. Pasada 1. |
| 16:29:13 | Error del motor arreglado. Pasada 1, de nuevo. |
| 16:35:59 | Arreglos de la pasada 1: dinosaurios, helechos, fuego. |
| 16:39:06 | Partitura y sintetizador. Pistas anteriores idénticas. |
| 16:41:53 | Composición vertical. |
| 16:42:29 | Pasada 2. |
| 16:44:55 | Arreglos de la pasada 2. |
| 16:45:03 | Empieza el render: 4 min 57 s, 20,2 MB. |
| 16:50:30 | Pasada 3, sobre el MP4. |
| 16:53:21 | Este documento escrito. |

**Total de la quinta parte: 38 min 14 s**, del encargo al documento terminado.
Sumado a las cuatro primeras (2 h 22 min 19 s): 3 h 0 min 33 s de trabajo.

Tiempos de máquina, medidos con `time` en 4 núcleos: sintetizar la pista
4,1 s; un fotograma del motor, unos 0,18 s; el proceso completo (síntesis,
1800 fotogramas verticales, unión y verificación) 4 min 57 s.

# Sexta parte: COSMOS en horizontal

## Qué se pidió

«Pásalo a horizontal para verlo en apaisado. Quita mi nombre y el texto de
arriba; deja solo lo de la línea de tiempo de abajo.»

## Qué hice

- **`cosmos-wide.mp4`**, 1920×1080 a 30 fps, 60 segundos, la misma película y
  el mismo sonido (la pista es el mismo archivo, byte a byte).
- **La imagen llena el cuadro.** Fuera la cabecera, el emblema, tu nombre y
  el pie de dos líneas.
- **Se queda lo de abajo:** la fecha y el nombre de cada época, y la línea de
  progreso, ahora sobre la imagen, abajo a la izquierda. Detrás llevan una
  sombra suave para que se lean también sobre el Big Bang o un cielo claro.
- **El título del final (COSMOS) se queda.** No estaba arriba sino en la
  imagen, y cierra la película. Si lo quieres fuera, es una línea.

## La decisión importante: renderizar más grande, no estirar

La versión vertical calcula la imagen a 1080×608. Estirarla a 1920×1080 la
habría dejado blanda: casi el doble de ancho sin un píxel nuevo. En vez de eso,
el motor ahora acepta una escala. Los planos siguen escritos igual, en las
coordenadas de la franja, y el motor multiplica posiciones y tamaños al
dibujar; la luz de cada punto, por la escala al cuadrado, para que al
repartirse en más píxeles brille lo mismo. Las capas suaves (niebla, gas,
fuego) suben un nivel en la pirámide, así que cuestan lo mismo y tienen el
mismo aspecto. El resultado es una imagen calculada de verdad a 1920×1081 (el
píxel de más se recorta).

## Comprobado

- **La vertical no ha cambiado.** A escala 1 todas esas multiplicaciones son
  por 1 exacto. 15 fotogramas del motor y 4 fotogramas completos de la
  composición vertical, renderizados antes y después del cambio: 0 píxeles
  distintos en los 19.
- **La horizontal tiene el mismo aspecto.** Reduje 10 fotogramas horizontales
  al tamaño de la franja y los comparé con los verticales: el brillo medio
  difiere menos de 0,6 sobre 255 y la imagen coincide a 35–39 dB de PSNR. En
  las ciudades baja a 27 dB porque a más resolución se ven luces más finas,
  que es justo lo que se buscaba.
- **El archivo final.** 1920×1080, 30 fps, 1800 fotogramas contados uno a uno,
  60,000000 s en vídeo, audio y contenedor. Pesa 46,1 MB, más del doble que la
  vertical: tiene 3,2 veces más píxeles, y el grano y el polvo se comprimen
  mal.
- **El mismo sonido.** El audio decodificado es idéntico, muestra a muestra,
  al de la versión vertical; desplazado 0 muestras respecto al WAV; −13,9 LUFS.
- **Los mismos golpes.** El brillo de la imagen salta de entre 17 y 168 a más
  de 200 exactamente en los fotogramas 144, 576, 816, 1296 y 1728, los mismos
  que en la vertical.
- **Lo que dejé como está.** En los cinco destellos blancos (unos tres
  fotogramas cada uno) la sombra de abajo oscurece el borde inferior del
  blanco. A velocidad normal se lee como parte del destello; arreglarlo
  costaba otro render de 11 minutos y no lo hice.

## Fotogramas revisados en esta parte

88 mirados: 15 del motor en horizontal, 12 completos de la composición (6
enteros y 6 recortes del tercio inferior, sobre lo más claro de la película),
un recorte a tamaño real y 60 del MP4 final, seguidos alrededor de cada corte
y cada golpe. Además, 29 comparados por medida: 19 bit a bit entre antes y
después del cambio en la vertical, y 10 entre la horizontal y la vertical.

Lo único que cambió por lo que vi: la sombra detrás del texto. La primera
versión no bastaba sobre el Big Bang, donde el texto se perdía en el
amarillo; la hice más oscura abajo y le puse una sombra al texto.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 17:01:04 | Empiezo. |
| 17:01:30 | Fotogramas de referencia de la versión vertical, para comparar después. |
| 17:04:16 | Motor con escala. Los 15 fotogramas del motor, idénticos. |
| 17:04:31 | Los 4 fotogramas completos verticales, idénticos. |
| 17:04:58 | Primeros fotogramas horizontales del motor, comparados con los verticales. |
| 17:06:02 | Composición horizontal: primeros fotogramas completos. |
| 17:06:32 | Sombra detrás del texto reforzada y comprobada sobre lo más claro. |
| 17:06:40 | Empieza el render. |
| 17:17:33 | Render terminado: 10 min 44 s, más del doble que la vertical (4 min 57 s), por los píxeles. |
| 17:18:51 | Verificación del archivo y revisión de 60 fotogramas del MP4. |
| 17:19:35 | Este documento escrito. |

**Total de la sexta parte: 18 min 31 s**, del encargo al documento terminado.
Sumado a las cinco primeras (3 h 0 min 33 s): 3 h 19 min 4 s de trabajo.

# Séptima parte: COSMOS a fondo — plano 1, el Big Bang

## Qué se pidió y cómo lo entendí

Rehacer COSMOS en horizontal y en 60 segundos, pero a fondo en vez de a lo
ancho: seis momentos de diez segundos en vez de dieciséis planos. El listón:
cualquier fotograma, parado a pantalla completa, tiene que parecer un
fotograma de película y no un diagrama. Cada plano con primer término, término
medio y fondo moviéndose a distinta velocidad, una luz que viene de algún
sitio y proyecta sombras, textura en todas las superficies y cosas pequeñas
que siguen moviéndose cuando la acción principal ha terminado. Cada momento
con sus propios efectos de sonido, sincronizados con lo que se ve.

Y el método: un plano cada vez. Terminar el primero, mandarte el clip y
**esperar tus notas** antes de empezar el siguiente. Para cada plano, apuntar
qué tendría la versión de un estudio de efectos profesional que la mía no
tiene, y cerrar el hueco más grande antes de darlo por terminado.

Esta parte es solo el plano 1. Los otros cinco se renderizan en negro hasta
que lleguen tus notas.

## Los seis momentos

Elegí los seis que pueden ser más espectaculares, en orden:

| Tiempo | Momento |
| --- | --- |
| 0–10 s | El Big Bang |
| 10–20 s | La primera galaxia |
| 20–30 s | Una estrella que muere |
| 30–40 s | Theia choca con la Tierra |
| 40–50 s | El asteroide |
| 50–60 s | El punto azul pálido |

**24 fps, como el cine, y 144 pulsos por minuto**: así un pulso dura
exactamente 10 fotogramas y cada plano son exactamente 24 pulsos. La imagen y
la música leen los mismos instantes de `src/deep/timeline.ts`; un golpe no
puede caer medio fotograma fuera de sitio porque no hay medio fotograma.

## El plano 1, momento a momento

| Pulso | Segundo | Qué se ve | Qué suena |
| --- | --- | --- | --- |
| 0–5 | 0,0 s | Un punto en la oscuridad que late tres veces; una espuma de chispas a su alrededor y destellos lejanos en el vacío. | Un zumbido grave que respira, un latido en cada pulso del punto, destellos agudos. |
| 4,75 | 2,0 s | El punto lo atrae todo hacia sí. | Una inspiración que sube… |
| 5,5–6 | 2,3 s | Nada. Negro. | …y se corta en seco: medio pulso de silencio total. |
| 6 | 2,5 s | El estallido: destello, y una bola de fuego que crece hacia la cámara. | Un chasquido, una caída de graves, un acorde de metales, un rugido que se acerca. |
| 8 | 3,3 s | El fuego llega a la cámara y nos traga. | Un instante de vacío y el golpe; empieza el rugido de dentro del fuego. |
| 8–18 | 3,3–7,5 s | Dentro del fuego: filamentos, humo negro, el núcleo que brilla y proyecta rayos, polvo que brilla a su luz. Seis lenguas de fuego pasan rozando la cámara. | Un tambor grande en cada destello del núcleo; un silbido que pasa por su lado en cada lengua; crepitar. |
| 18–21,5 | 7,5–9,0 s | La primera luz: el humo se abre en nubes oscuras con bordes encendidos contra un cielo naranja. | El rugido muere; un acorde cálido y cuatro campanas. |
| 21,5–23 | 9,0–9,6 s | Las edades oscuras: el cielo se apaga, queda una red de hilos oscuros. | Vuelve el zumbido del principio. |
| 23–24 | 9,6–10 s | La primera estrella se enciende donde estaba el punto, y su luz corre por los hilos de gas. | Un latido, una campana alta, destellos que se alejan. |

Rótulos: «13.8 billion years ago / The Big Bang» dentro del fuego y «380,000
years later / First light» en la primera luz, que se va antes de las edades
oscuras. Abajo, la línea de tiempo de
toda la película (en este clip llega a un sexto).

## Qué elegí y por qué

**Un motor nuevo, más profundo que el de COSMOS** (`src/deep/`). El de COSMOS
pintaba en 2D con trucos; este calcula la luz en 3D:

- **Volúmenes de verdad.** Para cada píxel se lanza un rayo desde la cámara a
  través del fuego (`volume.ts`). En cada paso, el medio emite su propia luz y
  dispersa la de una fuente en el centro, con una función de fase que manda la
  luz sobre todo hacia delante, como el humo real.
- **Sombras de verdad.** Una rejilla de 96×96 direcciones × 56 distancias
  guarda cuánta luz del centro sobrevive hasta cada punto. Un grumo denso
  oscurece todo lo que hay detrás y la luz sale en rayos por los huecos.
- **Detalle que no se convierte en ruido.** El ruido fractal sale de una
  textura de 128³ horneada una vez (mucho más barata que calcularlo), y cada
  paso del rayo solo usa las octavas que es capaz de resolver: más finas
  serían arena.
- **Desenfoque de movimiento y de foco.** El fuego se expande desde un punto,
  así que su desenfoque de movimiento se calcula analíticamente (cada punto se
  mueve hacia fuera en proporción a su distancia y su profundidad). Las
  chispas, el polvo y las brasas tienen profundidad de campo de verdad.
- **Acabado de película:** bloom en seis niveles, halación roja, destello
  anamórfico, fantasmas de lente, calima, aberración cromática, viñeta, virado
  de sombras y luces, una curva que conserva el tono (un naranja muy brillante
  sigue naranja en vez de volverse blanco) y grano.

**La primera estrella, hecha de puntos y no de volumen.** Los hilos de gas que
ilumina son 104.352 puntos repartidos en 13 hilos: siete que llegan a la
estrella y seis que pasan cerca. Cada hilo son varias fibras que se enroscan,
se separan y se juntan, con grumos a lo largo y una bruma fina alrededor. Así
están nítidos a cualquier distancia. Su luz cae con la distancia a la estrella
y solo llega hasta donde ha llegado el frente de luz, que avanza 22 unidades
por segundo: se ve la luz correr por los hilos.

**La primera luz, a contraluz.** En vez de una niebla naranja, el humo se queda
en sus filamentos, se vuelve denso y emite donde es fino: los bordes de las
nubes brillan contra el cielo, como las nubes delante del sol.

**El sonido, todo sintetizado.** Diez efectos nuevos en el mismo sintetizador
de siempre (`scripts/make-music.ts`): zumbido, latido, estallido, rugido que se
acerca, rugido de dentro del fuego, silbido de algo que pasa, tambor grande,
crepitar, destellos y un brillo de tonos agudos. La partitura (`src/deep/score.ts`)
está en fa menor: Fa menor en el estallido, Re♭ al entrar en el fuego, Si♭
menor, Do, La♭ mayor en la primera luz y Fa mayor en la primera estrella.

## Qué descarté

- **Una onda de choque como velo.** Una capa esférica fina alrededor de la
  bola de fuego: se veía como un velo gris delante de todo. La sustituí por un
  pico de exposición en el destello.
- **El vibrado aleatorio de los rayos.** Lanzar cada rayo desde un punto al
  azar para romper las franjas: daba arena que hervía de un fotograma a otro.
  Un experimento lo aisló (con y sin lenguas, con y sin vibrado). Lo cambié por
  un desplazamiento suave y fijo en el tiempo: ni franjas ni arena.
- **Los «radios» de volumen hacia la primera estrella.** Ocho hilos densos de
  volumen: la estrella se veía como un resplandor enorme con un agujero negro
  al lado. No era un fallo de cálculo (lo medí: ni un NaN, ni un negativo):
  era espacio vacío junto a una estrella que iluminaba todo lo demás con una
  fuerza absurda. Los cambié por los hilos de puntos.
- **Volúmenes al doble de resolución.** Ver «El hueco más grande», abajo.

## Qué cambió entre versiones

Veinte rondas de fotogramas de prueba (`d0` a `d19`), más las del hueco:

1. **Todo quemado.** La primera versión estaba sobreexpuesta y el fuego era
   casi opaco. Medí los niveles de luz y recalibré densidad, brillo y luz, con
   más huecos.
2. **La red cósmica demasiado densa.** Pasó a ser hilos donde se cruzan dos
   crestas de ruido, nueve veces más finos.
3. **Franjas y arena.** Ver «Qué descarté».
4. **Color melocotón.** La curva de tonos llevaba el naranja brillante al
   beige. La cambié por una que trabaja sobre el brillo y conserva el tono, y
   una rampa de color de fuego hecha a mano.
5. **La superficie de la bola de fuego eran fideos.** Desde fuera, el calor
   sale ahora de celdas grandes que hierven, no de filamentos.
6. **La primera estrella.** Resplandor → agujero → cables → hilos de gas (ver
   arriba).
7. **La primera luz.** Niebla naranja borrosa → nubes oscuras con bordes
   encendidos.
8. **El sonido**, medido (ver abajo): los tambores no se oían bajo el rugido;
   los silbidos se movían poco de lado; las campanas de la primera luz quedaban
   tapadas por el acorde.
9. **El rótulo.** En el primer MP4, «First light» seguía en pantalla durante
   las edades oscuras y cuando se enciende la primera estrella, que no es la
   primera luz. Ahora se va antes de las edades oscuras, y lo volví a
   renderizar.

## Qué tendría la versión de un estudio de efectos que la mía no tiene

Lo apunté mirando los fotogramas a tamaño real, de mayor a menor:

1. **Una simulación de fluidos de verdad.** Un estudio simularía el fuego
   (pyro): remolinos que se enrollan sobre sí mismos y evolucionan con la
   física. El mío es ruido que hierve: el movimiento es creíble, pero no es un
   fluido.
2. **Detalle fino en los volúmenes.** Su fuego tiene hilos finísimos y bordes
   nítidos; el mío, en el término medio y el fondo, es blando.
3. **Sonido grabado.** Fuego, explosiones y silbidos de librería, diseñados y
   mezclados escuchando, con canal de graves propio. El mío es síntesis
   mezclada midiendo, porque no oigo.
4. **Imagen lechosa.** Un etalonador pondría negros de verdad en el humo.
   Medido: dentro del fuego (fotograma 120) el 1 % más oscuro de la imagen
   estaba en 55 sobre 255, y en la primera luz (fotograma 198) en 94. No había
   nada oscuro.
5. **Dispersión múltiple.** El fuego real se ilumina a sí mismo; el mío
   dispersa la luz una sola vez, desde una sola fuente.
6. **Una cámara con operador.** Cambios de foco, respiración de la lente; la
   mía orbita y da sacudidas.

**Los huecos 1 y 3 no se pueden cerrar con estas reglas**: una simulación de
fluidos a esta resolución en una CPU tardaría horas por fotograma, y el sonido
grabado está fuera por la regla de solo código.

## El hueco más grande que cerré

Probé primero el 2, porque parecía el más grande de los que se pueden tocar, y
medí antes de quedármelo:

- **Volúmenes al doble de píxeles** (960×540 en vez de 640×360): 2,1 veces más
  lento (7,1 → 14,9 s por fotograma) y la nitidez, medida con un laplaciano
  sobre la imagen reducida a la mitad para quitar el grano, cambió entre 0 y
  +1 %. No era la resolución: el detalle lo limita cuántas octavas de ruido
  puede resolver cada paso del rayo.
- **Pasos más finos cerca de la cámara y una o dos octavas más**: 1,7 veces
  más lento, otra vez entre −1 y +1 %. Para que se notara habría que hacer los
  pasos lejanos diez veces más finos: cientos de pasos por rayo.

Las dos, descartadas. Así que el hueco más grande de los que sí se cerraban
era el 4, **la imagen lechosa**, y lo cerré con un etalonaje: contraste
alrededor del brillo medio de cada fotograma (la media de su logaritmo), con
un tope para no quemar las luces, y menos velo de bloom. Medido sobre los
mismos fotogramas:

| Fotograma | 1 % más oscuro, antes → después | 99 % más claro, antes → después |
| --- | --- | --- |
| 120, dentro del fuego | 55 → 29 | 210 → 217 |
| 156, dentro del fuego | 10 → 2 | 163 → 212 |
| 198, primera luz | 94 → 51 | 189 → 202 |

Ahora el humo tiene bolsas negras, los filamentos se separan del fondo y las
nubes de la primera luz se leen como siluetas. Antes de la entrada en el fuego
(pulso 7,5) el etalonaje vale 1 y nada cambia.

## El sonido, medido

No oigo: todo esto está medido sobre el WAV, no escuchado.

- **El silencio**: del pulso 5,5 al 6, −68,3 dB de media (solo el dither).
- **Los golpes caen en su fotograma.** Arranques medidos: el estallido en el
  fotograma 60,0 y la primera estrella en el 230,2; los latidos en los pulsos
  2,00 y 4,01.
- **Cada silbido va a su lado.** Diferencia izquierda−derecha entre 400 y
  4000 Hz, ±0,25 s alrededor de cada lengua: +4,9 (izq.), −5,8 (der.), +7,0
  (izq.), −6,4 (der.), +5,9 (izq.), −7,1 dB (der.). Todas del lado correcto.
- **Los tambores se oyen bajo el rugido.** El rugido toma aire en cada
  tambor y crece después. Salto de nivel en los 30 ms del golpe: entre +6,6 y
  +10,2 dB en seis de los ocho. Los dos últimos, que van seguidos a 0,2 s del
  anterior y con el silbido de la última lengua ya llegando, se quedan en +5,9
  y +4,2 dB: se oyen como golpes, pero menos limpios. Lo dejo dicho.
- **Las campanas de la primera luz** son lo más fuerte en su altura
  (−21 dB en su banda, frente a −30 a −38 dB del acorde).
- **Pico**: −2,85 dBFS. El estallido toca el limitador suave del máster: es
  el momento más fuerte de todo.

## Lo que comprobé de que lo anterior sigue intacto

Añadir efectos al sintetizador tocaba un archivo que comparten todas las
piezas. Regeneré las seis pistas anteriores (CODY, POIRIER, CODY POIRIER,
LUMEN, SPLASH y COSMOS) y comparé su SHA-256 con el de antes: idénticas, bit
a bit.

## Lo que no pude comprobar

- **Cómo suena.** Ver arriba.
- **Cómo se ve en una pantalla grande y calibrada.** Miré los fotogramas en
  mis herramientas; el etalonaje está medido con percentiles, no con un
  monitor de referencia.

## El archivo, comprobado

- 1920×1080, 24 fps, **240 fotogramas contados uno a uno**; 10,000000 s en
  vídeo, audio y contenedor. 22,4 MB.
- **El sonido no se ha movido**: el audio decodificado del MP4 coincide con el
  WAV con 0 muestras de desfase. Fundido de 0,4 s al final del clip (la
  película sigue después; el clip no).
- **Los golpes caen en su fotograma, también en la imagen.** El brillo medio
  salta de 2,0 a 52,2 exactamente en el fotograma 60 (el estallido) y de 125,7
  a 183,5 en el 80 (el fuego llega a la cámara): los mismos fotogramas en los
  que arrancan sus sonidos.
- Pico del audio ya codificado: −1,77 dBFS.

## Fotogramas revisados en esta parte

Unos 200 fotogramas de prueba en 20 rondas; 29 en las pruebas del hueco,
medidos además con percentiles y con un laplaciano; 27 sacados de los MP4
(21 del primero y 6 del segundo, después de arreglar el rótulo); y varios
recortes a tamaño real, sobre todo de la primera estrella.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 17:52:16 | Empiezo. |
| 17:52:31 | Los seis momentos, a 24 fps y 144 pulsos. |
| 17:58:39 | Motor nuevo y primera ronda de fotogramas de prueba. |
| 18:03–18:37 | Rondas 1 a 11: el fuego, las franjas y la arena, el color. |
| 18:40:42 | Ronda 12: la primera estrella sigue siendo un resplandor con un agujero. |
| 18:50:37 | El agujero, medido: no es un fallo. Hilos de puntos. |
| 18:54:12 | La primera estrella, terminada. |
| 18:55–18:59 | La primera luz a contraluz. |
| 19:00:29 | El plano entero en una hoja. |
| 19:03:26 | Partitura y efectos escritos. |
| 19:04:57 | Primera pista; las seis anteriores, idénticas. |
| 19:09:36 | Sonido medido y corregido: tambores, silbidos, campanas. |
| 19:10:37 | La composición `CosmosDeep`. |
| 19:11:01 | Primer render. Lo paro en el fotograma 112 para cerrar antes el hueco. |
| 19:13:25 | El hueco: fotogramas de referencia. |
| 19:14:07 | Volumen al doble de píxeles: no cambia nada. Descartado. |
| 19:16:00 | Pasos más finos y más octavas: tampoco. Descartado. |
| 19:18–19:21 | El etalonaje, en tres pasadas medidas. |
| 19:22:39 | Render del clip: 9 min 27 s. |
| 19:32:18 | Clip comprobado y revisado: el rótulo sobra en la estrella. |
| 19:33:15 | Segundo render: 9 min 15 s. |
| 19:42:45 | Clip comprobado otra vez. |
| 19:43:21 | Las seis pistas anteriores, idénticas otra vez. |
| 19:43:58 | Este documento escrito. |

**Total de la séptima parte: 1 h 51 min 42 s**, del encargo al documento terminado.
Sumado a las seis primeras (3 h 19 min 4 s): 5 h 10 min 46 s de trabajo.

Ahora espero tus notas antes de empezar el plano 2.

# Octava parte: tus notas sobre el plano 1

## Las notas y cómo las entendí

> First light seems to happen after the fire but is shown in the timeline
> about a second earlier. 90% fire 10% light

Dos cosas:

1. **El rótulo iba por delante de la imagen.** «First light» salía en el pulso
   18,5 (7,7 s), cuando en pantalla todavía había fuego; la luz no se leía
   como luz hasta alrededor de los 8,3 s. Tenías razón, y la causa era mía: la
   imagen pasaba del fuego a la luz en un fundido de más de un segundo, y el
   rótulo estaba puesto al principio de ese fundido.
2. **La proporción: 90 % fuego, 10 % luz.** Lo leí como respuesta a lo que te
   pregunté («cuánto fuego y cuánta primera luz»). Antes era 77 % y 23 % (5 s
   de fuego, 1,5 s de luz).

Si la segunda frase no era una proporción que querías sino una descripción de
lo que se veía cuando salía el rótulo, la primera corrección ya lo resuelve, y
la luz se puede volver a alargar cambiando dos números (`cool` y `dark` en
`src/deep/timeline.ts`).

## Qué cambié

- **El fuego dura hasta el pulso 20** (8,33 s) en vez de hasta el 18. Tres
  tambores más (pulsos 18, 19 y 19,5) y una séptima lengua de fuego que pasa
  por la izquierda en el 18,75.
- **La primera luz es un acontecimiento, no un fundido.** Llega en tres
  fotogramas alrededor del pulso 20: el negro que había entre las nubes de
  humo se inunda de luz, la exposición sube un instante, y lo que queda de
  humo se cierra en nubes oscuras con los bordes encendidos.
- **Dura un pulso y medio** (0,63 s) y se apaga hacia las edades oscuras, que
  empiezan en el 21,5. La primera estrella sigue en el 23.
- **El rótulo entra en el mismo fotograma que la luz** y está entero tres
  fotogramas después. Antes tardaba siete. Y **se va con la luz**: en un
  primer render seguía en pantalla durante las edades oscuras, que es el mismo
  error por el otro lado; lo corregí y volví a renderizar.
- **Por qué no puede volver a pasar.** Los tiempos de después del fuego
  estaban escritos como números sueltos en veinte curvas distintas (brillo,
  densidad, cielo, exposición, contraste…), y el rótulo en otro sitio. Ahora
  todos se escriben respecto a dos nombres, `cool` y `dark`, que son los
  mismos que leen el rótulo y la partitura. Mover la primera luz es cambiar
  un número.
- **El sonido de la primera luz.** El último compás del fuego espera sobre un
  acorde de Do (suspendido y luego resuelto), con un crescendo de un pulso.
  Luego 60 ms de casi silencio, y en el pulso 20 el rugido se corta en seco y
  entran un platillo suave, el acorde de La♭ y cuatro campanas hacia arriba.
  La primera versión de este cambio no tenía ese silencio y, medida, la luz no
  «llegaba» en el sonido: el nivel cambiaba 1 dB, porque el crescendo anterior
  sonaba tan fuerte como el golpe.

## Medido

| Qué | Resultado |
| --- | --- |
| Proporción en la línea de tiempo | 14 pulsos de fuego (del 6 al 20), 1,5 de luz: 90,3 % y 9,7 % |
| Proporción en la imagen | Fuego en los fotogramas 60 a 199 (140), luz del 200 al 215 (16): 89,7 % y 10,3 % |
| Brillo medio de la imagen | Fotograma 198: 40. 199: 74. **200: 152.** 201: 164 |
| Nivel del sonido por fotograma | 198: −11,4 dB. 199: −34,8 dB (el silencio). **200: −9,8 dB** |
| El golpe de la luz, 30 ms después frente a 60 ms antes | +9,9 dB en graves, +6,6 en medios, +13,3 en agudos |
| El rótulo | Empieza en el fotograma 200, entero en el 203, se va entre el 212 y el 218 |
| La lengua nueva | 4,8 dB más fuerte por la izquierda, su lado |
| Los tambores nuevos | +6,2, +6,4 y +4,5 dB sobre el rugido |
| El archivo | 240 fotogramas contados, 10,000000 s, audio a 0 muestras del WAV, 21,0 MB |
| Las seis pistas anteriores | Idénticas bit a bit (SHA-256) después de tocar el sintetizador |

## Lo que dejo dicho

- **El rótulo «First light» está entero medio segundo.** Con la luz al 10 % no
  puede estar más tiempo sin nombrar algo que ya no se ve. Las dos palabras
  grandes se leen; la línea pequeña de encima, justa.
- **Tres de los once tambores** (los que van a 0,2 s de otro: pulsos 16,5, 17
  y 19,5) se quedan entre +4,2 y +5,7 dB: se oyen como golpes, menos limpios
  que el resto.
- Sigo sin oír: todo lo del sonido está medido.

## Fotogramas revisados en esta parte

15 de prueba alrededor del paso del fuego a la luz, 12 del primer MP4 y 6 del
segundo.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 20:22:49 | Llegan tus notas. |
| 20:28 | Todos los tiempos de después del fuego, reescritos respecto a `cool` y `dark`. |
| 20:30 | Fotogramas de prueba: la luz llega en el fotograma 200. |
| 20:32 | Partitura nueva. Medida: la luz no «llega» en el sonido; añado el silencio. |
| 20:32:44 | Render: 9 min 39 s. |
| 20:43 | Revisado: el rótulo sigue en las edades oscuras. Corregido. |
| 20:43:20 | Segundo render: 9 min 34 s. |
| 20:53:50 | Archivo y sonido comprobados; las seis pistas anteriores, idénticas. |
| 20:54:16 | Este documento escrito. |

**Total de la octava parte: 31 min 27 s**, de tus notas al documento terminado.
Sumado a las siete primeras (5 h 10 min 46 s): 5 h 42 min 13 s de trabajo.

# Novena parte: más luz

## La nota

> No, I don't want it at 90% fire and 10% light I was telling you what was
> already going on. I thought you were asking me how much fire compared to
> light. Just do your recommendation. Yes, it needs more light

Entendí mal la nota anterior. «90% fire 10% light» describía lo que se veía,
no lo que querías. En la octava parte dejé escrita esa otra lectura como
posible; era la buena, y debí preguntar antes de renderizar en vez de después.
El resultado fue hacer lo contrario de lo que hacía falta: quitar luz.

Lo que sí estaba bien de la octava parte se queda: la luz llega de golpe y no
en un fundido, el rótulo entra en ese mismo fotograma y se va con ella, y hay
un respiro de silencio antes para que la llegada se oiga.

## Mi recomendación: dos tercios de fuego, un tercio de luz

| | Antes de tus notas | Octava parte | Ahora |
| --- | --- | --- | --- |
| Fuego (del estallido a la primera luz) | 5,0 s | 5,83 s | **4,17 s** |
| Primera luz | 1,46 s | 0,63 s | **2,29 s** |
| Proporción | 77 % y 23 % | 90 % y 10 % | **65 % y 35 %** |
| La luz llega en | 7,5 s, en un fundido de un segundo | 8,33 s, en tres fotogramas | **6,67 s, en tres fotogramas** |

Por qué esa proporción:

- **El fuego sigue siendo lo principal**, pero cuatro segundos le bastan: la
  bola que crece, la llegada a la cámara, cuatro lenguas que pasan rozando y
  siete tambores. Más largo empezaba a repetirse.
- **La luz necesita tiempo para mirarse.** En 2,3 s cabe todo lo que tiene:
  llega de golpe, las nubes quedan a contraluz con los bordes encendidos, la
  red de hilos oscuros se va formando delante de ella, enrojece y se apaga.
  Con 0,6 s solo cabía el golpe.
- **El rótulo se puede leer**: dos segundos enteros en pantalla, en vez de
  medio.
- **Cae en una barra de compás** (pulso 16, fotograma 160), que es donde la
  música quiere un cambio así.

Por qué en la primera versión parecía 90 y 10 aunque la línea de tiempo dijera
77 y 23: la luz tardaba un segundo en leerse como luz. Ahora se lee desde su
primer fotograma, así que lo que dice la línea de tiempo es lo que se ve.

## Qué cambié

- **La primera luz, del pulso 20 al 16.** Como desde la octava parte todo
  cuelga de dos nombres (`cool` y `dark`), fue cambiar un número. Al hacerlo
  salieron diez curvas del fuego que todavía tenían números sueltos en medio
  (en los pulsos 12 y 16) y que con la luz en el 16 quedaban desordenadas;
  ahora también se escriben respecto a `cool`.
- **El fuego, recompuesto para su nueva duración**: siete tambores (los dos
  últimos, seguidos, empujan hacia la luz) y cuatro lenguas de fuego.
- **La luz se sostiene.** Antes bajaba sin parar desde que llegaba; ahora se
  mantiene tres pulsos y medio y cae al final.
- **La red aparece durante la luz**, no después: hilos oscuros contra el
  cielo naranja, que es como mejor se ven.
- **La música de la luz**: tres acordes con el bajo bajando por grados hacia
  la oscuridad (La♭, Mi♭ sobre Sol, Fa menor), cada uno más apagado que el
  anterior. Las cuatro campanas hacia arriba cuando llega, y luego una línea
  lenta de otras cuatro hacia abajo mientras enrojece.

## Medido

| Qué | Resultado |
| --- | --- |
| Proporción en la línea de tiempo | 10 pulsos de fuego, 5,5 de luz: 64,5 % y 35,5 % |
| Proporción en la imagen | Fuego en los fotogramas 60 a 159 (100), luz del 160 al 214 (55): 64,5 % y 35,5 % |
| Brillo medio de la imagen | Fotograma 158: 38. 159: 73. **160: 150.** 161: 164 |
| Cuánto aguanta la luz | Por encima de 100 hasta el fotograma 200 (8,3 s); en 33 en el 214 |
| Nivel del sonido por fotograma | 158: −10,9 dB. 159: −34,4 dB (el respiro). **160: −10,0 dB** |
| El golpe de la luz, 30 ms después frente a 60 ms antes | +6,6 dB en graves, +11,7 en medios, +15,9 en agudos |
| El rótulo | Empieza en el fotograma 160, entero del 163 al 212 (2,0 s), se va con la luz |
| Las cuatro lenguas | 4,7, 6,1, 7,2 y 6,7 dB más fuertes por su lado |
| Los siete tambores | Seis entre +6,5 y +11,7 dB sobre el rugido; el último, a 0,2 s del anterior, +5,5 |
| El archivo | 240 fotogramas contados, 10,000000 s, audio a 0 muestras del WAV, 22,0 MB |
| Volumen | −11,5 LUFS, pico real −1,5 dBTP (bajé el clip 0,6 dB: sin eso el pico real quedaba en −0,9) |
| Las seis pistas anteriores | Idénticas bit a bit (SHA-256) |

Sigo sin oír: todo lo del sonido está medido.

## Fotogramas revisados en esta parte

20 de prueba, de dentro del fuego a la primera estrella, y 12 del MP4.

## Cuánto tardó de verdad esta parte

| Hora (UTC) | Hito |
| --- | --- |
| 21:01:50 | Llega tu nota. |
| 21:04 | La primera luz en el pulso 16; las curvas que quedaban sueltas, atadas. |
| 21:05 | Partitura recompuesta. |
| 21:06 | Sonido medido; un tambor reforzado. |
| 21:07 | 20 fotogramas de prueba revisados. |
| 21:07:50 | Render: 9 min 34 s. |
| 21:18 | Archivo comprobado; pico real corregido; las seis pistas anteriores, idénticas. |
| 21:19:06 | Este documento escrito. |

**Total de la novena parte: 17 min 16 s**, de tu nota al documento terminado.
Sumado a las ocho primeras (5 h 42 min 13 s): 5 h 59 min 29 s de trabajo.

El plano 2 sigue sin empezar: espero tu visto bueno.
