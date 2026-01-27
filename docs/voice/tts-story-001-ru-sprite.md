# Audio-sprite (RU) — Story 001 — черновая математика под 03:24

Источник фраз/порядка: [`docs/voice/story-001-ru-tts.md`](docs/voice/story-001-ru-tts.md:1) (53 cueId в фиксированном порядке).

## Исходные вводные
- Длина аудио (как ты написал): **03:24 = 204 000 ms**
- Кол-во cue: **53**
- Черновой шаг: **204000 / 53 ≈ 3849.0566 ms**

Ниже я сделал **равномерную сетку** (примерно), чтобы у тебя уже была структура. Ты потом подвинешь реальные тайминги как послушаешь.

## Итог (то, что подключено в конфиге)
В [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1) сейчас стоит:
- `audioSprite.ru.url = "/stories/story-001/audio/ru.opus"`
- `audioSprite.ru.cues` — 53 точки старта (ms) по таблице ниже

## Таблица таймингов (черновая)

|    # | cueId                                 | ttsKey                                                  | start (mm:ss.mmm) | startMs |
| ---: | ------------------------------------- | ------------------------------------------------------- | ----------------: | ------: |
|    1 | cue_scene009_fire_truck               | kids.stories.story001.scene009.fire_truck               |         00:00.000 |       0 |
|    2 | cue_scene009_ladder                   | kids.stories.story001.scene009.ladder                   |         00:03.849 |    3849 |
|    3 | cue_scene009_firefighter              | kids.stories.story001.scene009.firefighter              |         00:07.698 |    7698 |
|    4 | cue_scene009_hose                     | kids.stories.story001.scene009.hose                     |         00:11.547 |   11547 |
|    5 | cue_scene009_fire                     | kids.stories.story001.scene009.fire                     |         00:15.396 |   15396 |
|    6 | cue_scene008_ambulance                | kids.stories.story001.scene008.ambulance                |         00:19.245 |   19245 |
|    7 | cue_scene008_paramedic                | kids.stories.story001.scene008.paramedic                |         00:23.094 |   23094 |
|    8 | cue_scene008_driver                   | kids.stories.story001.scene008.driver                   |         00:26.943 |   26943 |
|    9 | cue_scene008_stretcher                | kids.stories.story001.scene008.stretcher                |         00:30.792 |   30792 |
|   10 | cue_scene008_lightbar                 | kids.stories.story001.scene008.lightbar                 |         00:34.642 |   34642 |
|   11 | cue_scene007_police_van               | kids.stories.story001.scene007.police_van               |         00:38.491 |   38491 |
|   12 | cue_scene007_officer                  | kids.stories.story001.scene007.officer                  |         00:42.340 |   42340 |
|   13 | cue_scene007_driver                   | kids.stories.story001.scene007.driver                   |         00:46.189 |   46189 |
|   14 | cue_scene007_lightbar                 | kids.stories.story001.scene007.lightbar                 |         00:50.038 |   50038 |
|   15 | cue_scene007_equipment                | kids.stories.story001.scene007.equipment                |         00:53.887 |   53887 |
|   16 | cue_scene010_garbage_truck            | kids.stories.story001.scene010.garbage_truck            |         00:57.736 |   57736 |
|   17 | cue_scene004_dump_truck               | kids.stories.story001.scene004.dump_truck               |         01:01.585 |   61585 |
|   18 | cue_scene004_dump_bed                 | kids.stories.story001.scene004.dump_bed                 |         01:05.434 |   65434 |
|   19 | cue_scene004_crane                    | kids.stories.story001.scene004.crane                    |         01:09.283 |   69283 |
|   20 | cue_scene004_wheelbarrow              | kids.stories.story001.scene004.wheelbarrow              |         01:13.132 |   73132 |
|   21 | cue_scene004_worker                   | kids.stories.story001.scene004.worker                   |         01:16.981 |   76981 |
|   22 | cue_scene005_bulldozer                | kids.stories.story001.scene005.bulldozer                |         01:20.830 |   80830 |
|   23 | cue_scene005_bulldozer_blade          | kids.stories.story001.scene005.bulldozer_blade          |         01:24.679 |   84679 |
|   24 | cue_scene005_tracks                   | kids.stories.story001.scene005.tracks                   |         01:28.528 |   88528 |
|   25 | cue_scene005_lighthouse               | kids.stories.story001.scene005.lighthouse               |         01:32.377 |   92377 |
|   26 | cue_scene005_ship                     | kids.stories.story001.scene005.ship                     |         01:36.226 |   96226 |
|   27 | cue_scene006_excavator_crane          | kids.stories.story001.scene006.excavator_crane          |         01:40.075 |  100075 |
|   28 | cue_scene006_hook                     | kids.stories.story001.scene006.hook                     |         01:43.925 |  103925 |
|   29 | cue_scene006_bricks                   | kids.stories.story001.scene006.bricks                   |         01:47.774 |  107774 |
|   30 | cue_scene006_lighthouse               | kids.stories.story001.scene006.lighthouse               |         01:51.623 |  111623 |
|   31 | cue_scene006_ship                     | kids.stories.story001.scene006.ship                     |         01:55.472 |  115472 |
|   32 | cue_scene003_tanker_truck             | kids.stories.story001.scene003.tanker_truck             |         01:59.321 |  119321 |
|   33 | cue_scene003_fuel_pumps               | kids.stories.story001.scene003.fuel_pumps               |         02:03.170 |  123170 |
|   34 | cue_scene003_station_canopy           | kids.stories.story001.scene003.station_canopy           |         02:07.019 |  127019 |
|   35 | cue_scene003_underground_tank         | kids.stories.story001.scene003.underground_tank         |         02:10.868 |  130868 |
|   36 | cue_scene003_pickup_truck             | kids.stories.story001.scene003.pickup_truck             |         02:14.717 |  134717 |
|   37 | cue_scene002_cement_truck             | kids.stories.story001.scene002.cement_truck             |         02:18.566 |  138566 |
|   38 | cue_scene002_chute                    | kids.stories.story001.scene002.chute                    |         02:22.415 |  142415 |
|   39 | cue_scene002_concrete                 | kids.stories.story001.scene002.concrete                 |         02:26.264 |  146264 |
|   40 | cue_scene002_cement_bags              | kids.stories.story001.scene002.cement_bags              |         02:30.113 |  150113 |
|   41 | cue_scene002_bricks                   | kids.stories.story001.scene002.bricks                   |         02:33.962 |  153962 |
|   42 | cue_scene011_excavator                | kids.stories.story001.scene011.excavator                |         02:37.811 |  157811 |
|   43 | cue_scene011_excavator_bucket         | kids.stories.story001.scene011.excavator_bucket         |         02:41.660 |  161660 |
|   44 | cue_scene011_operator                 | kids.stories.story001.scene011.operator                 |         02:45.509 |  165509 |
|   45 | cue_scene011_construction_tower_crane | kids.stories.story001.scene011.construction_tower_crane |         02:49.358 |  169358 |
|   46 | cue_scene012_wheel_loader             | kids.stories.story001.scene012.wheel_loader             |         02:53.208 |  173208 |
|   47 | cue_scene012_loader_bucket            | kids.stories.story001.scene012.loader_bucket            |         02:57.057 |  177057 |
|   48 | cue_scene012_loader_operator          | kids.stories.story001.scene012.loader_operator          |         03:00.906 |  180906 |
|   49 | cue_scene012_soil_pile                | kids.stories.story001.scene012.soil_pile                |         03:04.755 |  184755 |
|   50 | cue_scene013_tractor                  | kids.stories.story001.scene013.tractor                  |         03:08.604 |  188604 |
|   51 | cue_scene013_tractor_loader           | kids.stories.story001.scene013.tractor_loader           |         03:12.453 |  192453 |
|   52 | cue_scene013_tractor_operator         | kids.stories.story001.scene013.tractor_operator         |         03:16.302 |  196302 |
|   53 | cue_scene013_hay                      | kids.stories.story001.scene013.hay                      |         03:20.151 |  200151 |
