// benchmarked vs https://subprotocol.com/system/genetic-hello-world.html
// local genetic is x2 faster

import { GeneticOptions, Select } from '../src/genetic';
import { IlandGeneticModel, IlandGeneticModelOptions, MigrateSelec } from '../src/iland-model';

const GENERATIONS = 4000;
const POPULATION = 4000;
const solution = 'Insanity is doing the same thing over and over again and expecting different results';

export async function ilandGenetic(log: boolean) {
    function randomString(len: number) {
        let text = '';
        const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < len; i++) text += charset.charAt(Math.floor(Math.random() * charset.length));

        return text;
    }

    function replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
    }

    async function randomFunction() {
        // create random strings that are equal in length to solution
        return randomString(solution.length);
    }

    async function mutationFunction(entity: string) {
        // chromosomal drift
        const i = Math.floor(Math.random() * entity.length);
        return replaceAt(
            entity,
            i,
            String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)),
        );
    }

    async function crossoverFunction(mother: string, father: string) {
        // two-point crossover
        const len = mother.length;
        let ca = Math.floor(Math.random() * len);
        let cb = Math.floor(Math.random() * len);
        if (ca > cb) {
            const tmp = cb;
            cb = ca;
            ca = tmp;
        }

        const son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
        const daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);

        return [son, daughter];
    }

    async function fitnessFunction(entity: string) {
        let fitness = 0;

        for (let i = 0; i < entity.length; ++i) {
            // increase fitness for each character that matches
            if (entity[i] == solution[i]) fitness += 1;

            // award fractions of a point as we get warmer
            fitness += (127 - Math.abs(entity.charCodeAt(i) - solution.charCodeAt(i))) / 50;
        }

        return { fitness };
    }

    const population = [];

    for (let i = 0; i < POPULATION; i++) {
        population.push(randomFunction());
    }

    const geneticOptions: GeneticOptions<string> = {
        mutationFunction,
        crossoverFunction,
        fitnessFunction,
        randomFunction,
        populationSize: POPULATION,
        fittestNSurvives: 1,
        select1: Select.FittestLinear,
        select2: Select.Tournament3,
    };

    const ilandOptions: IlandGeneticModelOptions<string> = {
        ilandCount: 8,
        ilandMutationProbability: 0.8,
        ilandCrossoverProbability: 0.8,
        migrationProbability: 0.1,
        migrationFunction: MigrateSelec.FittestLinear,
    };

    const continentBreenAfter = 50;
    const continentGenerationsCount = 10;

    const genetic = new IlandGeneticModel<string>(ilandOptions, geneticOptions);

    async function solve() {
        await genetic.seed();

        for (let i = 0; i <= GENERATIONS; i++) {
            if (log) {
                console.count('gen');
            }

            if (i % continentBreenAfter === 0) {
                // Move to continent
                genetic.moveAllToContinent();

                for (let j = 0; j < continentGenerationsCount; j++) {
                    await genetic.continentalEstimate();
                    await genetic.continentalBreed();
                    i++;
                }

                // Move to ilands
                genetic.migrateToIlands();
            }

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
    }

    return solve();
}
