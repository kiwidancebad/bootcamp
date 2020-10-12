const UserAPI = require('../user')

const mockStore = {
  users: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
  },
  trips: {
    findOrCreate: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
  },
}

const ds = new UserAPI({ store: mockStore })
ds.initialize({ context: { user: { id: 1, email: 'abc@a.b' } } })

describe('UserAPI', () => {
  describe('[UserAPI.findOrCreateUser]', () => {
    it('returns null for invalid emails', async () => {
      const res = await ds.findOrCreateUser({ email: 'realUser' })
      expect(res).toEqual(null)
    })

    it('looks up/creates user in store', async () => {
      mockStore.users.findOrCreate.mockReturnValueOnce([{ id: 1 }])

      const res = await ds.findOrCreateUser({ email: 'abc@a.b' })
      expect(res).toEqual({ id: 1 })
      expect(mockStore.users.findOrCreate).toBeCalledWith({
        where: { email: 'abc@a.b' },
      })
    })

    it('returns null if no user found/created', async () => {
      const res = await ds.findOrCreateUser({ email: 'abc@a.b' })
      expect(res).toEqual(null)
    })
  })

  describe('[UserAPI.bookTrip]', () => {
    it('calls store creator and returns result', async () => {
      mockStore.trips.findOrCreate.mockReturnValueOnce([{ get: () => 'wow' }])

      const res = await ds.bookTrip({ launchId: 1 })

      expect(res).toBeTruthy()
      expect(mockStore.trips.findOrCreate).toBeCalledWith({
        where: { launchId: 1, userId: 1 },
      })
    })
  })

  describe('[UserAPI.bookTrips]', () => {
    it('returns multiple lookups from book trip', async () => {
      mockStore.trips.findOrCreate.mockReturnValueOnce([{ get: () => 'wow' }])
      mockStore.trips.findOrCreate.mockReturnValueOnce([{ get: () => 'no' }])

      const res = await ds.bookTrips({ launchIds: [1, 2] })
      expect(res).toEqual(['wow', 'no'])
    })
  })

  describe('[UserAPI.cancelTrip]', () => {
    it('calls store destroy and returns result', async () => {
      const args = { userId: 1, launchId: 1 }

      mockStore.trips.destroy.mockReturnValueOnce('hey')

      const res = await ds.cancelTrip(args)

      expect(res).toBeTruthy()
      expect(mockStore.trips.destroy).toBeCalledWith({ where: args })
    })
  })

  describe('[UserAPI.getLaunchIdsByUser]', () => {
    it('looks up launches by user', async () => {
      const args = { userId: 1 }

      mockStore.trips.findAll.mockReturnValueOnce([
        { dataValues: { launchId: 1 } },
        { dataValues: { launchId: 2 } },
      ])

      const res = await ds.getLaunchIdsByUser(args)

      expect(res).toEqual([1, 2])
      expect(mockStore.trips.findAll).toBeCalledWith({ where: args })
    })

    it('returns empty array if nothing found', async () => {
      const res = await ds.getLaunchIdsByUser({ userId: 1 })
      expect(res).toEqual([])
    })
  })
})
