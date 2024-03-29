# Blazing fast Genetic Algorithm

**Async Genetic** its crossplatform implementation of genetic algorithms. It's pretty asyncronous and use `Promises`. Genetic algorithms allow solving problems such as game balance optimization, solving equations, creating visual effects, optimizing system parameters, and others.

<img src="./.github/logo.png" width="500" />

# Abstract

Genetic Algorithm (GA) is one of the most well-regarded evolutionary algorithms in the history. This algorithm mimics Darwinian theory of survival of the fittest in nature. This chapter presents the most fundamental concepts, operators, and mathematical models of this algorithm. The most popular improvements in the main component of this algorithm (selection, crossover, and mutation) are given too. The chapter also investigates the application of this technique in the field of image processing. In fact, the GA algorithm is employed to reconstruct a binary image from a completely random image.

# Island Model

The simulation model of the behavior of population settlement on islands helps to create species diversity. On the islands, the degree of mutation and isolation of the population from the main part allows the creation of local dominant genes.

In the local implementation of this model, the mainland is also used to cross all populations. You can manually manipulate the population migrations to the mainland and islands as often as you like.

<img src="./.github/island.png" width="400" />

## Installation

Releases are available under Node Package Manager (npm):

    npm install async-genetic

## Examples

**Gnetic guess text phrase**

[Classic Model Test](./test/genetic.ts)
[Island Model Test](./test/island.ts)

![Genetic console](./.github/genetic-classic-console.png)
## How to use

### GeneticAlgorithm constructor
```js
import { Genetic } from 'async-genetic';

const config = {...};
const population = [...];
const genetic = new Genetic(config);
await genetic.seed(population);

```
The minimal configuration for constructing an GeneticAlgorithm calculator is like so:

```js
const config = {
    mutationFunction: (phenotype: T) => Promise<T>; // you custom mutation fn
    crossoverFunction: (a: T, b: T) => Promise<Array<T>>; // you custom crossover fn
    fitnessFunction: (phenotype: T, isLast: boolean) => Promise<{ fitness: number, state?: any }>; // // you custom fitness fn
    randomFunction: () => Promise<T>; // you custom random phenotype generator fn
    populationSize: number; // constant size of population
    mutateProbablity?: number; // perturb prob random phenotype DNA
    crossoverProbablity?: number; // crossover prob
    fittestNSurvives?: number; // good old boys, fittest are not crossing in current generation
    select1?: (pop) => T; // Select one phenotype by Selection method e.g. Select.Random or Select.Fittest
    select2?: (pop) => T; // Select for crossover by Selection method e.g. Select.Tournament2 or Select.Tournament3
    deduplicate?: (phenotype: T) => boolean; // Remove duplicates (not recommended to use)
}

const settings = {...};
const population = [...];
const genetic = new Genetic(config);
```

That creates one instance of an GeneticAlgorithm calculator which uses the initial configuration you supply.  All configuration options are optional except *population*.  If you don't specify a crossover function then GeneticAlgorithm will only do mutations and similarly if you don't specify the mutation function it will only do crossovers.  If you don't specify either then no evolution will happen, go figure.

### genetic.estimate( )
Estimate current generation by fitnessFunction
```js
await geneticalgorithm.estimate( )
```
The *.estimate()* add score number per each phenotype in population
### genetic.breed(); 
```js
async function solve() {
    await genetic.seed(); // filled by random function or passed pre defined population T[]

    for (let i = 0; i <= GENERATIONS; i++) {
        console.count('gen');
        await genetic.estimate(); // estimate i generation
        await genetic.breed(); // breed (apply crossover or mutations)

        const bestOne = genetic.best()[0]; // get best one
        console.log(bestOne);

        if (bestOne.entity === solution) {
            break;
        }
    }
}
```
to do two evolutions and then get the best N phenoTypes with scores (see *.scoredPopulation(N)* below).

### genetic.best(N)
Retrieve the Phenotype with the highest fitness score like so. You can get directly N best scored items
```js
const best = genetic.best(1)
// best = [{...}];
```

# Functions
This is the specification of the configuration functions you pass to GeneticAlgorithm

### mutationFunction(phenotype)
> Must return a phenotype

The mutation function that you provide.  It is a synchronous function that mutates the phenotype that you provide like so:
```js
async function mutationFunction (oldPhenotype) {
	var resultPhenotype = {}
	// use oldPhenotype and some random
	// function to make a change to your
	// phenotype
	return resultPhenotype
}
```

### crossoverFunction (phenoTypeA, phenoTypeB)
> Must return an array [] with 2 phenotypes

The crossover function that you provide.  It is a synchronous function that swaps random sections between two phenotypes.  Construct it like so:
```js
async function crossoverFunction(phenoTypeA, phenoTypeB) {
	var result = {}
	//  result should me created by merge phenoTypeA and phenoTypeB in custom rules
	return result;
}
```

###  fitnessFunction (phenotype) [async]
> Must return a promise with number

```js
async function fitnessFunction(phenotype) {
	var fitness = 0
	// use phenotype and possibly some other information
	// to determine the fitness number.  Higher is better, lower is worse.
	return { fitness, state: { foo: 'bar' } };
}
```

### crossoverFunction (phenotypeA, phenotypeB)
> Must return childs phenotypes after breeding phenotypeA and phenotypeB

```js
async function crossoverFunction(mother: string, father: string) {
    // two-point crossover
    const len = mother.length;
    let ca = Math.floor(Math.random() * len);
    let cb = Math.floor(Math.random() * len);
    if (ca > cb) {
		[ca, cb] = [cb, ca];
    }

    const son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
    const daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);

    return [son, daughter];
}
```

### Configuring
> Next T - is your custom phenotype

| Parameter  | Type | Description |
| ------------- | ------------- | ------------- |
| mutationFunction | (phenotype: T) => Promise<T>  | Mutate you phenotype as you describe  |
| crossoverFunction | (a: T, b: T) => Promise<Array<T>> | Cross two different phenotypes in to once (merge)  |
| fitnessFunction | (phenotype: T) => Promise<number> | Train you phenotype to get result (scores more - better) |
| randomFunction | () => Promise<T> | Function generate random phenotype to complete the generation |
| populationSize | number | Number phenotypes in population |
| mutateProbablity | number [0...1] | Each crossover may be changed to mutation with this chance |
| fittestNSurvives | number [0...population.length -1] | Each generation fittest guys will survive |
| select1 | Select | select one phenotype from population for mutate or cloning |
| select2 | Select | select two or more phenotype from population for crossing over |
| optimize | (a: T, b:T) => boolean  | order function for popultaion |
| deduplicate | boolean | Remove duplicates from phenotypes |


### Selection method
> Should be used for select1, select2 parameters

| Type | Description |
| ------------- | ------------- |
| Select.Random | Select random phenotype from population |
| Select.RandomLinear | Select random phenotype from population |
| Select.Fittest | Select best one phenotype from population |
| Select.FittestLinear | Select linear best one phenotypes from population |
| Select.Tournament2 | Select 2 random phenotypes from population and take best of 2 |
| Select.Tournament3 | Select 3 random phenotype from population and take best of 3|
| Select.RandomLinearRank | Select random phenotype from population with linear rank |
| Select.Sequential | Select phenotype from population by linear function |


# Island Model 

Island model have absolutely same interface with classic genetic.

```typescript
// Use Island model imports
import { IslandGeneticModel, IslandGeneticModelOptions, Migrate, GeneticOptions } from 'async-genetic';

// Island configuration
const islandOptions: IslandGeneticModelOptions<string> = {
    islandCount: 8, // count of islands
    islandMutationProbability: 0.8, // mutation on island are different from continental
    islandCrossoverProbability: 0.8, // same for crossover, because island area are small
    migrationProbability: 0.1, // migration to another island chance
    migrationFunction: Migrate.FittestLinear, // select migrated phenotype
};

// Move to continent after each 50 generations
const continentBreedAfter = 50;
// How many generations to breed at continent left
let continentGenerationsCount = 0;

const genetic = new IslandGeneticModel<string>(islandOptions, geneticOptions);
await genetic.seed();

for (let i = 0; i <= GENERATIONS; i++) {
    if (log) {
        console.count('gen');
    }

    if (i !== 0 && i % continentBreedAfter === 0) {
        // Move to continent
        genetic.moveAllToContinent();
        // Setup next 10 generations to breed at continent
        continentGenerationsCount = 10;
    }

    if (continentGenerationsCount) {
        // Reduce continent generations
        continentGenerationsCount--;

        // If continent generations over, move to islands
        if (continentGenerationsCount === 0) {
            // Move to islands
            genetic.migrateToIslands();
        }
    }

    // Estimate on island or continent, by configuration
    await genetic.estimate();

    const bestOne = genetic.best()[0];

    if (log) {
        console.log(`${bestOne.entity} - ${bestOne.fitness}`);
    }

    await genetic.breed();

    if (bestOne.entity === solution) {
        return i;
    }
}

```

### Migration method
> Should be used for selection Phenotype and move to another island (migrate)

| Type | Description |
| ------------- | ------------- |
| Migrate.Random | Select random phenotype from population |
| Migrate.RandomLinearelect random phenotype from population |
| Migrate.Fittest | Select best one phenotype from population |
| Migrate.FittestLinear | Select linear best one phenotypes from population |



```javascript
// Move to continent, islands has no populations after that
genetic.moveAllToContinent();
// Split population and move to islands (each island got same of total population part)
genetic.migrateToIslands();
```
