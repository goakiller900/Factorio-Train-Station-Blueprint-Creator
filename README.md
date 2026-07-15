# Factorio - Train Station Blueprint Creator

[Live version here](https://goakiller900.github.io/Factorio-Train-Station-Blueprint-Creator/)

This fork updates the train station blueprint generator for Factorio 2.1.

The project originally started as the [Burny's Train Station Blueprint Creator mod](https://mods.factorio.com/mod/BurnysTSBC) and was later converted into a website so generated blueprints can be used without installing a mod on a multiplayer server.

This website makes it easier to create large train stations for the game [Factorio](https://factorio.com/).

## Factorio 2.1 status

The `factorio-2.1` branch is currently under active compatibility testing.

- Blueprint entities use the Factorio 2.x direction format.
- Circuit connections are exported using the Factorio 2.x top-level wire format.
- Inserter filters use the current inserter entities instead of the removed filter-inserter entity.
- Logistic chest requests are exported as logistic sections.
- Decider combinator and train-stop control behavior is migrated to the Factorio 2.x blueprint format.
- Existing stacker layouts temporarily use Factorio's legacy rail prototypes so their original rail geometry is preserved. Rebuilding the stacker templates with the new rail geometry is still planned.

## Features

- Load/unload for normal (inserter+chests) and fluid (pumps+storage tanks) stations
- Supports single and [double headed](https://forums.factorio.com/viewtopic.php?t=53937) trains
- Variable inserter types, belt types, chest types (use logistic chests for bot loading / unloading)
- Optional inserter filters (up to 5 resource types)
- Connect all chests / storage tanks with green / red wire
- Choice which side of the train stations should be used (left, right, both)
- Beltflow towards the front or back of the station
- [Chest limiting](https://wiki.factorio.com/Stack#Stack_limitation)
- Automatic locomotive refuel (with requester chests for fuel near locomotives)
- Automatic lamps, poles, and signal placement
- [Stackers](https://www.youtube.com/watch?v=x6-P74xYvYg) (vertical and diagonal): let trains wait in queue before using the station
- [Train limit per station](https://factorio.com/blog/post/fff-361)
- [Include train in the blueprint](https://www.factorio.com/blog/post/fff-263)

## Screenshots

![A normal train station](screenshots/station2-8-2.png "A normal train station")
![A fluid station](screenshots/station-fluid.png "A fluid station")
![Left-left vertical stacker](screenshots/stacker-left-left-1-4-1.png "Left-left vertical stacker")
![Diagonal stacker](screenshots/stacker-diagonal.png "Diagonal stacker")
![A huge station](screenshots/station2-100-2.png "A huge station")

## Development

### Requirements

- Node (npm)

### Updating the item list

Go to [this website](https://github.com/kevinta893/factorio-recipes-json) and download the `recipes.json` file. Place it in `src/constants/` as file `itemlist.json`.

### Start development mode

```
npm install
npm run start
```

### Build the project

```
npm run build
```

### Biome autoformatting

`npm run lint-format`
