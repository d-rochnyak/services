var vent = _.extend({}, Backbone.Events);

var Service = Backbone.Model.extend({
	childrens: {},

	defaults: {
		id: null,
		name: '',
		pid: null
	},

	initialize: function() {
		this.on('destroy', this.deleteCascade, this);
	},

	setChild: function(service) {
		var id = service.get('id');
		var childrens = _.clone(this.childrens);

		childrens[id] = service;

		this.childrens = childrens;
	},

	deleteChild: function(id) {
		delete this.childrens[id];
	},

	getChilds: function() {
		return this.childrens;
	},

	deleteCascade: function(model) {
		var childs = model.getChilds();
		
		_.each(childs, function(modelChild, id) {
			model.deleteChild(id);
			modelChild.set({id: null}, {silent: true});
			modelChild.destroy();
		});
	}
});

var ServiceList = Backbone.Collection.extend({
	model: Service,
	url: '/service',

	initialize: function() {
		this.on('reset', this.initTree, this);
		this.on('change:pid', this.changePidInModel, this);
		this.on('change:id', this.changePidInModel, this);
		this.on('destroy', this.deleteModel, this);
	},

	initTree: function(collection) {
		collection.forEach(function(service, i) {
			var pid = service.get('pid'),
				parent = collection.get(pid);

			if(parent) {
				parent.setChild(service);
			}
		});
	},

	changePidInModel: function(model) {
		var pid = model.get('pid');
		if(pid === null)
			return;

		this.get(pid).setChild(model);
	},

	deleteModel: function(model) {
		var pid = model.get('pid');
		if(pid === null)
			return;

		this.get(pid).deleteChild(model.get('id'));
	}
});

var ServiceView = Backbone.View.extend({
	model: Service,

	className: 'service well',
	template: _.template($('#service-template').html()),

	events: {
		'click .add': 'showAdd',
		'click .edit': 'showEdit',
		'click .delete': 'showDelete'
	},
	initialize: function() {
		this.$el.attr('id', 'service' + this.model.get('id'));

		this.model.on('change', this.render, this);
		this.model.on('destroy', this.remove, this);
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	showAdd: function(e) {
		var pid = this.model.get('id');
		vent.trigger('viewModalForService:show', {pid: pid});

		e.stopPropagation();
	},
	showEdit: function(e) {
		var obj = this.model.toJSON();
		vent.trigger('viewModalForService:show', obj);

		e.stopPropagation();
	},
	showDelete: function(e) {
		var bConfirm = confirm('Вы действительно хотите удалить услугу "'+this.model.get('name')+'"');

		if(bConfirm) {
			this.model.destroy();
		}
		e.stopPropagation();
	}
});

var ServiceListView = Backbone.View.extend({
	collection: ServiceList,
	el: '#services',
	viewsServices: {},

	tmplModal: _.template($('#modal-win-template').html()),

	events: {
		'click #add-service': 'toggleAddService',
		'click #modal-win .close': 'toggleAddService',
		'click #btn-modal-send': 'saveService',
	},
	initialize: function() {
		this.$content = $('<div>', {'class': 'services-content'});
		this.$btnAdd = $('<button>', {'id': 'add-service', 'text': 'Добавить', 'class': 'btn btn-primary'});
		this.$el.append(this.$content).append(this.$btnAdd);

		this.initListeners();

		this.collection.fetch({reset: true});
	},
	initListeners: function() {
		var collection = this.collection;

		this.listenTo(collection, 'add', this.addService);
		this.listenTo(collection, 'reset', this.render, this);
		this.listenTo(collection, 'change:pid', this.render, this);
		this.listenTo(collection, 'change:id', this.render, this);

		vent.on('viewModalForService:show', this.showModal, this);
	},

	render: function() {
		this.$content.empty();
		this.addServices(this.collection);

		return this;
	},

	addService: function(service, block) {
		if (block instanceof Backbone.Collection || !block)
			block = this.findParentBlock(service);

		var _this = this,
			view = new ServiceView({model: service});
		block.append(view.render().$el);

		_.each(service.getChilds(), function(model, i) {
			_this.addService(model, view.$el);
		});
	},
	addServices: function(collection) {
		var _this = this;

		collection.where({pid: null}).forEach(function(model, i) {
			_this.addService(model, _this.$content);
		});
	},

	findParentBlock: function(service) {
		var pid = service.get('pid');
		if(pid) {
			var model = this.collection.get(pid);
			var id = model ? 'service' + model.get('id') : 0;
			var block = $('#'+id);

			return block.length > 0 ? block : this.$content;
		}

		return this.$content;
	},

	toggleAddService: function() {
		if(this.$el.find(this.$modal).length) {
			this.$modal.remove();
		} else {
			this.showModal();
		}
	},

	showModal: function(obj) {
		obj = obj || {};
		obj = _.extend({
				id: null,
				pid: null,
				name: '',
				services: this.collection
			}, obj);

		var html = this.tmplModal(obj);

		this.$modal = $(html);

		this.$el.append(this.$modal);
	},
	saveService: function(e) {
		var obj = this.$modal.find('form').serializeArray(),
			data = {};
		_.each(obj, function(v) {
			var value = (v.name == 'id' || (v.name == 'pid' && v.value != null)) ?
				parseInt(v.value) : v.value;
			value = isNaN(value) ? null : value;

			data[v.name] = value;
		});

		if(data.id <= 0) {
			delete data.id;

			this.collection.create(data, {wait: true, success: function(model, id) {
				model.set({id: parseInt(id)});
			}});
		} else {
			this.collection.findWhere({id: data.id}).save(data);
			//this.collection.get(data.id).save(data);
		}

		this.toggleAddService();
		//e.preventDefault();
	}
});


var Services = new ServiceList();
var AppView = new ServiceListView({collection: Services});