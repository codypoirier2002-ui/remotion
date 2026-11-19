# DECISIONES

Dos vídeos de 15 segundos, uno por nombre, **CODY** y **POIRIER**, y un tercero
de 30 segundos en el que el primero desemboca en el segundo y termina con el
nombre completo. Todo es código: la tipografía, el movimiento y la música. No
hay fuentes, imágenes, vídeo de archivo ni muestras de audio.

Este documento tiene dos partes. La primera cuenta CODY, que fue el primer
encargo. La segunda, más abajo, cuenta POIRIER y la unión.

## Resultado

| Archivo | Qué es | Duración | Fotogramas | Tamaño |
| --- | --- | --- | --- | --- |
| `cody.mp4` | CODY | 15,000000 s | 900 | 20,3 MB |
| `poirier.mp4` | POIRIER, se sostiene solo | 15,000000 s | 900 | 19,5 MB |
| `cody-poirier.mp4` | Los dos unidos | 30,000000 s | 1800 | 39,8 MB |

Los tres: H.264, 1920×1080, 60 fps, AAC estéreo a 48 kHz. Medido con `ffprobe`
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
