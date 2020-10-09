const S3 = require('aws-sdk/clients/s3');
const isEmail = require('isemail');

const mime = require('mime');
const { nanoid } = require('nanoid');
const { DataSource } = require('apollo-datasource');

class UserAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  initialize = config => {
    this.context = config.context;
  }

  findOrCreateUser = async ({ email: emailArg } = {}) => {
    const email = this.context?.user?.email ?? emailArg;

    if (!email || !isEmail.validate(email)) {
      return null;
    }

    const user = await this.store.users.findOrCreate({ where: { email }});

    return user?.length ? user[0] : null;
  }

  bookTrips = async ({ launchIds }) => {
    const userId = this.context.user.id;

    if (!userId) {
      return;
    }

    let results = [];

    for (const launchId of launchIds) {
      const res = await this.bookTrip({ launchId });
      if (res) {
        results.push(res);
      }
    }

    return results;
  }

  bookTrip = async ({ launchId }) => {
    const userId = this.context.user.id;
    const res = await this.store.trips.findOrCreate({
      where: { userId, launchId },
    });

    return res?.length ? res[0].get() : false;
  }

  cancelTrip = async ({ launchId }) => {
    const userId = this.context.user.id;
    return Boolean(this.store.trips.destroy({ where: { userId, launchId }}));
  }

  getLaunchIdsByUser = async () => {
    const userId = this.context.user.id;
    const found = await this.store.trips.findAll({
      where: { userId },
    });

    return found?.length 
      ? found.map(l => l.dataValues.launchId).filter(l => Boolean(l)) : [];
  }

  isBookedOnLaunch = async ({ launchId }) => {
    if (!this.context?.user) {
      return false;
    }

    const userId = this.context.user.id;
    const found = await this.store.trips.findAll({ where: { userId, launchId }});

    return found?.length > 0;
  }

  uploadProfileImage = async ({ file }) => {
    const userId = this.context?.user?.id;
    if (!userId) {
      return;
    }

    const s3 = new S3();

    const { createReadStream, mimetype } = await file;
    const filename = nanoid() + '.' + mime.getExtension(mimetype);

    const { AWS_S3_BUCKET } = process.env;

    await s3
      .upload({
        ACL: 'public-read',
        Body: createReadStream(),
        Bucket: AWS_S3_BUCKET,
        Key: filename,
        ContentType: mimetype,
      })
      .promise();

    return this.context.user.update({
      profileImage: `https://${AWS_S3_BUCKET}.s3.us.west-2.amazonaws.com/${filename}`
    });
  }
}

module.exports = UserAPI;
