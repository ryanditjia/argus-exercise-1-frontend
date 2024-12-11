'use client'

import { useNakamaRPC } from './NakamaRPC'

export const AttackButton = () => {
	const rpc = useNakamaRPC()

	return (
		<button onClick={() => rpc('tx/game/attack-player', { Target: 'CoolMage' })}>Attack</button>
	)
}
