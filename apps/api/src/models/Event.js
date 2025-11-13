import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 300,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 2000,
			default: null,
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		organizer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		calendar: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Calendar",
			required: true,
			index: true,
		},
		time_zone: {
			type: String,
			required: true,
			default: "UTC",
			trim: true,
		},
		start: {
			type: Date,
			required: true,
			index: true,
		},
		end: {
			type: Date,
			required: true,
			validate: {
				validator: function (value) {
					return value > this.start;
				},
				message: "End date must be after start date",
			},
		},
		location: {
			type: {
				name: {
					type: String,
					trim: true,
					maxlength: 500,
				},
				address: {
					type: String,
					trim: true,
					maxlength: 500,
				},
				coordinates: {
					longitude: {
						type: Number,
						min: -180,
						max: 180,
					},
					latitude: {
						type: Number,
						min: -90,
						max: 90,
					},
				},
				url: {
					type: String,
					trim: true,
					maxlength: 1000,
					validate: {
						validator: (value) => !value || /^https?:\/\/.+/.test(value),
						message: "Invalid URL format",
					},
				},
			},
			default: null,
		},
		is_all_day: {
			type: Boolean,
			default: false,
			index: true,
		},
		status: {
			type: String,
			enum: ["confirmed", "tentative", "cancelled"],
			default: "confirmed",
			index: true,
		},
		attendees: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					index: true,
				},
				email: {
					type: String,
					trim: true,
				},
				status: {
					type: String,
					enum: ["invited", "accepted", "declined", "maybe"],
					default: "invited",
				},
				invited_at: {
					type: Date,
					default: Date.now,
				},
				responded_at: {
					type: Date,
				},
			},
		],
	},
	{
		timestamps: {
			createdAt: "created",
			updatedAt: "updated",
		},
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
		indexes: [
			[{ start: 1, end: 1 }],
			[{ title: "text", description: "text" }],
			[{ calendar: 1, start: 1 }],
			[{ calendar: 1, status: 1 }],
			[{ organizer: 1, start: 1 }],
			[{ is_all_day: 1, start: 1 }],
		],
		statics: {
			/**
			 * @param {import('mongoose').Types.ObjectId | string} calendarId
			 * @param {{ startDate?: Date, endDate?: Date }} [options]
			 */
			findByCalendar(calendarId, options = {}) {
				const query = this.find({ calendar: calendarId });

				if (options.startDate || options.endDate) {
					const dateFilter = {};
					if (options.startDate) dateFilter.$gte = options.startDate;
					if (options.endDate) dateFilter.$lte = options.endDate;
					query.where("start", dateFilter);
				}

				return query.populate("creator organizer calendar");
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} creatorId
			 */
			findByCreator(creatorId) {
				return this.find({ creator: creatorId }).populate(
					"creator organizer calendar",
				);
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} organizerId
			 */
			findByOrganizer(organizerId) {
				return this.find({ organizer: organizerId }).populate(
					"creator organizer calendar",
				);
			},

			/**
			 * @param {Date} startDate
			 * @param {Date} endDate
			 * @param {{ calendarId?: import('mongoose').Types.ObjectId | string }} [options]
			 */
			findInDateRange(startDate, endDate, options = {}) {
				const query = this.find({
					$or: [
						{ start: { $gte: startDate, $lte: endDate } },
						{ end: { $gte: startDate, $lte: endDate } },
						{ start: { $lte: startDate }, end: { $gte: endDate } },
					],
				});

				if (options.calendarId) {
					query.where("calendar", options.calendarId);
				}

				return query.populate("creator organizer calendar");
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} userId
			 */
			findByAttendee(userId) {
				return this.find({
					$or: [
						{ creator: userId },
						{ organizer: userId },
						{ "attendees.user": userId },
					],
				}).populate("creator organizer calendar attendees.user");
			},
		},
		methods: {
			/**
			 * @param {import('mongoose').Types.ObjectId | string} userId
			 */
			hasAccess(userId) {
				return (
					this.creator.toString() === userId.toString() ||
					this.organizer.toString() === userId.toString()
				);
			},

			isActive() {
				const now = new Date();
				return this.start <= now && this.end >= now;
			},

			isUpcoming() {
				return this.start > new Date();
			},

			isPast() {
				return this.end < new Date();
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
			 * @param {boolean} [isUser=true]
			 */
			addAttendee(userIdOrEmail, isUser = true) {
				const existingIndex = this.attendees.findIndex((attendee) => {
					if (isUser && attendee.user) {
						return attendee.user.toString() === userIdOrEmail.toString();
					}
					return attendee.email === userIdOrEmail;
				});

				if (existingIndex === -1) {
					const attendeeData = isUser
						? { user: userIdOrEmail, status: "invited" }
						: { email: userIdOrEmail, status: "invited" };

					this.attendees.push(attendeeData);
				}
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
			 * @param {'invited' | 'accepted' | 'declined' | 'maybe'} status
			 * @param {boolean} [isUser=true]
			 * @returns {void}
			 */
			updateAttendeeStatus(userIdOrEmail, status, isUser = true) {
				const attendeeIndex = this.attendees.findIndex((attendee) => {
					if (isUser && attendee.user) {
						return attendee.user.toString() === userIdOrEmail.toString();
					}
					return attendee.email === userIdOrEmail;
				});

				if (attendeeIndex >= 0) {
					this.attendees[attendeeIndex].status = status;
					this.attendees[attendeeIndex].responded_at = new Date();
				}
			},

			/**
			 * @param {import('mongoose').Types.ObjectId | string} userIdOrEmail
			 * @param {boolean} [isUser=true]
			 * @returns {void}
			 */
			removeAttendee(userIdOrEmail, isUser = true) {
				this.attendees = this.attendees.filter((attendee) => {
					if (isUser && attendee.user) {
						return attendee.user.toString() !== userIdOrEmail.toString();
					}
					return attendee.email !== userIdOrEmail;
				});
			},
		}
	},
);

// Virtual for event ID (alias for _id)
eventSchema.virtual("id").get(function () {
	return this._id.toHexString();
});

// Virtual for event duration in minutes
eventSchema.virtual("duration").get(function () {
	return Math.round((this.end - this.start) / (1000 * 60));
});

export const Event = mongoose.model("Event", eventSchema);
