/**
 * Users module.
 * @module Users
 */
const core = require('./core');

/**
 * This object is used to handle every user object. Each user has an unique id, a {@link DetectorHandler} object to manage the 
 * detectors they need, an expiration date and a fixed lifespan.
 * @constant {Object}
 * @name userHandler
 */
const userHandler = {
	users: [],
	/**
	 * Adds a new user to the system. Each user will hold their own emotion detector. Users have a limited lifespan,
	 * especified in the <code>expires</code> attribute. A <code>setInterval</code> function is used to remove every expired
	 * user. Users can increase their lifespan by doing actions, which will move their expire date <code>active</code> miliseconds
	 * into the future.
	 * @function addUser
	 * @param {number} uniqueID - Unique id value generated with uniqid npm module.
	 * @return {number} Unique user id.
	 */
	addUser: function (uniqueID) {
		const newUser = {
			id: uniqueID,
			detectorHandler: {},
			expires: new Date(Date.now() + 5000),
			active: 300000
		};
		//Adding the first user enabled the interval in charge of deleting old users
		this.users.push(newUser);
		if (this.users.length === 1) {
			enableUserExpirationInterval();
		}
		return newUser.id;
	},
	/** Checks if user exists.
	 * @function userExists
	 * @param {number} id - Unique id used when the user was created.
	 * @return {boolean} Does the user exist?
	 */
	userExists: function (id) {
		//find returns the found object or undefined
		const foundUser = this.users.find((user) => user.id === id);
		const userCheck = typeof foundUser !== 'undefined';
		if (userCheck) {
			this.refreshUserSession(foundUser);
		}
		return userCheck;
	},
	/**
	 * Retrieve the user object
	 * @function getUser
	 * @param {number} id - Unique id used when the user was created.
	 * @return {Object|undefined} User object, or undefined if the user doesn't exist.
	 */
	getUser: function (id) {
		return this.users.find((user) => user.id === id);
	},
	/**
	 * Refresh an user's expiration time. This function must be called everytime an user performs an action.
	 * @function refreshUserSession
	 * @param {Object|number} user - The user object or its numeric id.
	 */
	refreshUserSession: function (user) {
		if (typeof user === 'number') {
			user = this.getUser(user);
		}
		if (typeof user !== 'undefined') {
			user.expires = new Date(Date.now() + user.active);
		}
	},
	/**
	 * Sets up an user's detectors according to a set of parameters especified in
	 * <code>preferences</code> (see [/setup]{@link module:API~/setup}). This function just called the
	 * <code><strong>setupDetectors</strong></code> function in
	 * <code><strong>[DetectorHandler]{@link module:Core~DetectorHandler} </strong></code>and returned the number
	 * of detectors affected by the filtering.
	 * @function setupUserDetector
	 * @param {string} userId - User unique id.
	 * @param {Object} preferences - Detectors setup information.
	 * @return {number} Number of filtered (removed) detectors.
	 */
	setupUserDetector: function (userId, preferences) {
		const detectorsAffected = this.getUser(userId).detectorHandler.setupDetectors(preferences);
		return detectorsAffected ? detectorsAffected : 0;
	},
	/**
	 *
	 * @function getDetectorLength
	 * @return {number} Total number of detectors.
	 */
	getDetectorLength: function () {
		return this.detectorHandler.lengthDetectors();
	},
	/**
	 * Expiration function called at a specified interval which filters out expired users.
	 * @function expirationTime
	 */
	expirationTime: function () {
		const len = this.users.length;
		this.users = this.users.filter((user) => Date.now() <= user.expires);
		if (len !== this.users.length) {
			console.log(len - this.users.length + ' users deleted');
		}
	},
	setDetectorHandler: function (userID, detectorHandler) {
		const user = this.getUser(userID);
		if (typeof user !== 'undefined') {
			user.detectorHandler = detectorHandler;
		}
	}
};

/**
 * Interval function which scans the users array with a certain frecuency looking for expired users.
 * If the users array is empty, this interval stops, and it's reenabled when a new user is added.
 * @function enableUserExpirationInterval
 */
function enableUserExpirationInterval() {
	//setInterval returns its id
	const expirationIntervalId = setInterval(function () {
		userHandler.expirationTime();
		//if there is no users, the interval is cancelled
		if (userHandler.users.length === 0) {
			console.log('no more users, interval stopped');
			clearInterval(expirationIntervalId);
		}
	}, 60000);
}


module.exports = userHandler;
