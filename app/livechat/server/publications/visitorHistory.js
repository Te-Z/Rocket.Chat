import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Subscriptions } from '../../../models';

Meteor.publish('livechat:visitorHistory', function({ rid: roomId }) {
	console.warn('The publication "livechat:visitorHistory" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	const room = LivechatRooms.findOneById(roomId);

	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } });
	if (!subscription) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorHistory' }));
	}

	const self = this;

	if (room && room.v && room.v._id) {
		const handle = LivechatRooms.findByVisitorId(room.v._id).observeChanges({
			added(id, fields) {
				self.added('visitor_history', id, fields);
			},
			changed(id, fields) {
				self.changed('visitor_history', id, fields);
			},
			removed(id) {
				self.removed('visitor_history', id);
			},
		});

		self.ready();

		self.onStop(function() {
			handle.stop();
		});
	} else {
		self.ready();
	}
});
