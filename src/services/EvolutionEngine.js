import { useEffect } from 'react'
import { useOSStore } from '../store'

// THE SINGULARITY: EVOLUTION ENGINE
// This component acts as the "Time" factor in the genetic algorithm.
// It silently observes and triggers gene mutation.

export const EvolutionEngine = () => {
    const { evolve, generation } = useOSStore()

    useEffect(() => {
        // Mutation Interval: Every 30 seconds (accelerated for demo, usually hours)
        const evolutionInterval = setInterval(() => {
            // "Survival of the Fittest": 
            // In a real system, we would score the current generation based on user engagement.
            // For now, we assume continued usage = success, so we drift/evolve properties.

            // 5% chance to trigger a major mutation event
            if (Math.random() > 0.0) {
                evolve()
            }
        }, 10000) // Evolve every 10 seconds for "Insane" demo speed

        return () => clearInterval(evolutionInterval)
    }, [evolve])

    // Render nothing, it's a ghost process
    return null
}
