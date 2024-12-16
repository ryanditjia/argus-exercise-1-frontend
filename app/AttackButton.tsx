'use client'

import { useNakama } from './nakama'

export const AttackButton = () => {
	const { rpc } = useNakama()

	return (
		<button onClick={() => rpc('tx/game/attack-player', { Target: 'CoolMage' })}>Attack</button>
	)
}
