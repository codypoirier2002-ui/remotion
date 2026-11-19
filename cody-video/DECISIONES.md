# DECISIONES

Vídeo de 15 segundos construido alrededor de cuatro letras: **CODY**.
Todo es código: la tipografía, el movimiento y la música. No hay fuentes,
imágenes, vídeo de archivo ni muestras de audio.

## Resultado

| | |
| --- | --- |
| Archivo | `cody.mp4` (20,3 MB) |
| Imagen | H.264, 1920×1080, 60 fps, 900 fotogramas |
| Sonido | AAC estéreo, 48 kHz, −11,4 LUFS, pico real −1,5 dBTP |
| Duración | 15,000000 s en el vídeo, en el audio y en el contenedor |

Medido con `ffprobe` sobre el archivo final, contando los fotogramas
decodificados uno a uno (`-count_frames`: 900).

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
