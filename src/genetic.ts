import { clone } from './utils';

export const Select = {
    Fittest,
    FittestLinear,
    FittestRandom,
    Random,
    RandomLinearRank,
    Sequential,
    Tournament2,
    Tournament3,
};
export interface GeneticOptions<T> {
    mutationFunction: (phenotype: T) => Promise<T>;
    crossoverFunction: (a: T, b: T) => Promise<Array<T>>;
    fitnessFunction: (phenotype: T) => Promise<number>;
    randomFunction: () => Promise<T>;
    populationSize: number;
    mutateProbablity?: number;
    crossoverProbablity?: number;
    fittestNSurvives?: number;
    select1?: (pop) => T;
    select2?: (pop) => T;
    deduplicate?: (phenotype: T) => boolean;
}

export interface Phenotype<T> {
    fitness: number;
    entity: T;
}

export class Genetic<T> {
    public stats = {};
    public options: GeneticOptions<T>;
    public population: Array<Phenotype<T>> = [];
    protected internalGenState = {}; /* Used for random linear */

    constructor(options: GeneticOptions<T>) {
        const defaultOptions: Partial<GeneticOptions<T>> = {
            populationSize: 250,
            mutateProbablity: 0.2,
            crossoverProbablity: 0.9,
            fittestNSurvives: 1,
            select1: Select.Fittest,
            select2: Select.Tournament2,
        };

        this.options = { ...defaultOptions, ...options };
    }

    /**
     * Startup population, if not passed than will be random generated by randomFunction()
     */
    public async seed(entities: Array<T> = []) {
        this.population = entities.map((entity) => ({ fitness: null, entity }));

        // seed the population
        for (let i = 0; i < this.options.populationSize; ++i) {
            this.population.push({ fitness: null, entity: await this.options.randomFunction() });
        }
    }

    public best(count = 1) {
        let population = this.population;

        if (this.options.deduplicate) {
            population = this.population.filter((ph) => this.options.deduplicate(ph.entity));
        }

        return population.slice(0, count).map((ph) => ph.entity);
    }

    /**
     * Breed population with optional breed settings
     */
    public async breed() {
        // crossover and mutate
        const newPop: Array<Phenotype<T>> = [];

        // lets the best solution fall through
        if (this.options.fittestNSurvives) {
            newPop.push(...this.cutPopulation(this.options.fittestNSurvives));
        }

        // Lenght may be change dynamically, because fittest and some pairs from crossover
        while (newPop.length < this.options.populationSize) {
            const crossed = await this.tryCrossover();

            newPop.push(...crossed.map((entity) => ({ fitness: null, entity })));
        }

        if (this.options.deduplicate) {
            this.population = this.population.filter((ph) => this.options.deduplicate(ph.entity));
            this.seed();
        }

        this.population = newPop;
    }

    /**
     * Estimate population before breeding
     */
    public async estimate() {
        const { fitnessFunction } = this.options;
        // reset for each generation
        this.internalGenState = {};
        const tasks = await Promise.all(this.population.map(({ entity }) => fitnessFunction(entity)));

        for (let i = 0; i < this.population.length; i++) {
            this.population[i].fitness = tasks[i];
        }

        this.population = this.population.sort((a, b) => (this.optimize(a.fitness, b.fitness) ? -1 : 1));

        const popLen = this.population.length;
        const mean = this.getMean();

        this.stats = {
            population: this.population.length,
            maximum: this.population[0].fitness,
            minimum: this.population[popLen - 1].fitness,
            mean,
            stdev: this.getStdev(mean),
        };
    }

    /**
     * Sort algorythm
     */
    protected optimize = (a: number, b: number) => {
        return a >= b;
    };

    /**
     * Try cross a pair or one selected phenotypes
     */
    private tryCrossover = async () => {
        const { crossoverProbablity, crossoverFunction } = this.options;
        let selected = crossoverFunction && Math.random() <= crossoverProbablity ? this.selectPair() : this.selectOne();

        if (selected.length === 2) {
            selected = await crossoverFunction(selected[0], selected[1]);
        }

        for (let i = 0; i < selected.length; i++) {
            selected[i] = await this.tryMutate(selected[i]);
        }

        return selected;
    };

    /**
     * Try mutate entity with optional probabilty
     */
    private tryMutate = async (entity: T) => {
        // applies mutation based on mutation probability
        if (this.options.mutationFunction && Math.random() <= this.options.mutateProbablity) {
            return this.options.mutationFunction(entity);
        }

        return entity;
    };

    /**
     * Mean deviation
     */
    private getMean() {
        return this.population.reduce((a, b) => a + b.fitness, 0) / this.population.length;
    }

    /**
     * Standart deviation
     */
    private getStdev(mean: number) {
        const { population: pop } = this;
        const l = pop.length;

        return Math.sqrt(pop.map(({ fitness }) => (fitness - mean) * (fitness - mean)).reduce((a, b) => a + b, 0) / l);
    }

    /**
     * Select one phenotype from population
     */
    private selectOne(): T[] {
        const { select1 } = this.options;

        return [clone(select1.call(this, this.population))];
    }

    /**
     * Select two phenotypes from population for crossover
     */
    private selectPair(): T[] {
        const { select2 } = this.options;

        return [clone(select2.call(this, this.population)), clone(select2.call(this, this.population))];
    }

    /**
     * Return population without an estimate (fitness)
     */
    private cutPopulation(count: number) {
        return this.population.splice(0, count).map((ph) => ({ fitness: null, entity: ph.entity }));
    }
}

/** Utility */

function Tournament2<T>(this: Genetic<T>, pop) {
    const n = pop.length;
    const a = pop[Math.floor(Math.random() * n)];
    const b = pop[Math.floor(Math.random() * n)];

    return this.optimize(a.fitness, b.fitness) ? a.entity : b.entity;
}

function Tournament3<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    const n = pop.length;
    const a = pop[Math.floor(Math.random() * n)];
    const b = pop[Math.floor(Math.random() * n)];
    const c = pop[Math.floor(Math.random() * n)];
    let best = this.optimize(a.fitness, b.fitness) ? a : b;
    best = this.optimize(best.fitness, c.fitness) ? best : c;

    return best.entity;
}

function Fittest<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    return pop[0].entity;
}

function FittestLinear<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    this.internalGenState['flr'] = this.internalGenState['flr'] || 0;

    return pop[this.internalGenState['flr']++].entity;
}

function FittestRandom<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    return pop[Math.floor(Math.random() * 11)].entity;
}

function Random<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    return pop[Math.floor(Math.random() * pop.length)].entity;
}

function RandomLinearRank<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    this.internalGenState['rlr'] = this.internalGenState['rlr'] || 0;
    return pop[Math.floor(Math.random() * Math.min(pop.length, this.internalGenState['rlr']++))].entity;
}

function Sequential<T>(this: Genetic<T>, pop: Array<Phenotype<T>>) {
    this.internalGenState['seq'] = this.internalGenState['seq'] || 0;
    return pop[this.internalGenState['seq']++ % pop.length].entity;
}
