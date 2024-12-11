'use client'

import { createContext, use, useCallback, useEffect, useState } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { client } from './nakama'
import { RpcResponse, Session } from '@heroiclabs/nakama-js'

type RPC = (id: string, input: object) => Promise<RpcResponse | void>

export const NakamaRPCContext = createContext<RPC>(async () => {})

type Status = 'idle' | 'loading' | 'success' | 'error'

export const NakamaRPCProvider = ({ children }: { children: React.ReactNode }) => {
	const [status, setStatus] = useState<Status>('idle')
	const [session, setSession] = useState<Session>()

	useEffect(() => {
		const initialize = async () => {
			try {
				console.group('NakamaRPCProvider initialize')
				setStatus('loading')

				// use FingerprintJS for unique device ID
				const fp = await FingerprintJS.load()
				const { visitorId } = await fp.get()
				console.log('visitorId: ', visitorId)

				const session = await client.authenticateDevice(visitorId)
				setSession(session)
				const account = await client.getAccount(session)
				console.log('account: ', account)

				// TODO: skip if already accepted (look into Nakama's Storage)
				await client
					.rpc(session, 'nakama/claim-persona', { personaTag: account.user?.username })
					.catch(() => {})

				setStatus('success')
			} catch (error) {
				console.error(error)
				setStatus('error')
			}

			console.groupEnd()
		}

		initialize()
	}, [])

	const rpc = useCallback(
		async (id: string, input: object): Promise<RpcResponse> => {
			if (!session) throw new Error('Nakama session not found')
			return await client.rpc(session, id, input)
		},
		[session],
	)

	if (status === 'idle') return null
	if (status === 'loading') return 'Initializing Nakama…'
	if (status === 'error') return 'Failed to initialize Nakama'

	return <NakamaRPCContext value={rpc}>{children}</NakamaRPCContext>
}

export const useNakamaRPC = () => use(NakamaRPCContext)
