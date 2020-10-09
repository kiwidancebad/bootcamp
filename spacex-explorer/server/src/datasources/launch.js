const { RESTDataSource } = require('apollo-datasource-rest');

class LaunchAPI extends RESTDataSource {
  baseURL = 'https://api.spacexdata.com/v2/';

  getAllLaunches = async () => {
    const response = await this.get('launches');
    return Array.isArray(response)
      ? response.map(launch => this.launchReducer(launch)) : [];
  }

  getLaunchById = async ({ launchId }) => {
    const response = await this.get('launches', { flight_number: launchId });
    return Array.isArray(response) && response.length > 0
      ? this.launchReducer(response[0]) : null;
  }

  getLaunchesByIds = async ({ launchIds }) => {
    return Promise.all(launchIds.map(launchId => this.getLaunchById({ launchId })));
  }

  launchReducer = launch => ({
    id: launch.flight_number || 0,
    cursor: `${launch.launch_date_unix}`,
    site: launch.launch_site?.site_name,
    mission: {
      name: launch.mission_name,
      missionPatchSmall: launch.links?.mission_patch_small,
      missionPatchLarge: launch.links?.mission_patch,
    },
    rocket: {
      id: launch.rocket?.rocket_id,
      name: launch.rocket?.rocket_name,
      type: launch.rocket?.rocket_type,
    },
  })
}

module.exports = LaunchAPI;
