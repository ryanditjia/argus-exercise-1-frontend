import { useEffect } from 'react'
import { Room } from './types'
import { useNakama } from './nakama'

const xLimit = 9
const yLimit = 9

export const Board = ({ room }: { room: Room }) => {
	const { player_x, player_y, goal_x, goal_y } = room
	const { rpc } = useNakama()

	useEffect(() => {
		// listen to WASD
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
				return
			}

			let direction: 'up' | 'down' | 'left' | 'right' | null = null
			switch (event.key) {
				case 'w':
					direction = 'up'
					break
				case 's':
					direction = 'down'
					break
				case 'a':
					direction = 'left'
					break
				case 'd':
					direction = 'right'
					break
			}

			if (direction) {
				rpc('tx/game/move', { Direction: direction })
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [rpc])

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="border border-gray-200 bg-white">
				{Array.from({ length: yLimit }, (_, rowIndex) => (
					<div key={rowIndex} className="flex">
						{Array.from({ length: xLimit }, (_, colIndex) => {
							const isPlayer = rowIndex === player_y && colIndex === player_x
							const isGoal = rowIndex === goal_y && colIndex === goal_x
							const hasWon = isPlayer && isGoal

							const renderTile = () => {
								if (hasWon) {
									return (
										<div className="flex h-full w-full items-center justify-center bg-green-500 font-bold text-green-900">
											🎉
										</div>
									)
								}

								if (isPlayer) {
									return (
										<div className="flex h-full w-full items-center justify-center bg-blue-500 font-bold text-white">
											You
										</div>
									)
								}

								if (isGoal) {
									return (
										<div className="flex h-full w-full items-center justify-center bg-red-500 font-bold text-red-50">
											Goal
										</div>
									)
								}
							}

							return (
								<div key={colIndex} className="h-16 w-16 border border-gray-200 bg-white">
									{renderTile()}
								</div>
							)
						})}
					</div>
				))}
			</div>
		</div>
	)
}
