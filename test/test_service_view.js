'use strict';

(function() {
  describe('juju service view', function() {
    var ServiceView, models, Y, container, service, db, conn,
        env, charm, ENTER, ESC;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views', 'juju-models', 'base', 'node', 'json-parse',
          'juju-env', 'node-event-simulate', 'juju-tests-utils', 'event-key',
          function(Y) {
            ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
            ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;
            models = Y.namespace('juju.models');
            ServiceView = Y.namespace('juju.views').service;
            done();
          });
    });

    beforeEach(function(done) {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub(),
      env = new (Y.namespace('juju')).Environment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm({id: 'mysql', name: 'mysql',
        description: 'A DB'});
      db.charms.add([charm]);
      // Add units sorted by id as that is what we expect from the server.
      db.units.add([{id: 'mysql/0', agent_state: 'pending'},
                    {id: 'mysql/1', agent_state: 'pending'},
                    {id: 'mysql/2', agent_state: 'pending'}
          ]);
      service = new models.Service({
        id: 'mysql',
        charm: 'mysql',
        unit_count: db.units.size(),
        exposed: false});

      db.services.add([service]);
      done();
    });

    afterEach(function(done) {
      container.remove();
      container.destroy();
      service.destroy();
      db.destroy();
      env.destroy();
      done();
    });

    it('should show controls to modify units by default', function() {
      var view = new ServiceView(
          {container: container, model: service, db: db,
            env: env, querystring: {}}).render();
      container.one('#num-service-units').should.not.equal(null);
    });

    it('should not show controls if the charm is subordinate', function() {
      charm.set('is_subordinate', true);
      var view = new ServiceView(
          {container: container, service: service, db: db,
            env: env, querystring: {}}).render();
      // "var _ =" makes the linter happy.
      var _ = expect(container.one('#num-service-units')).to.not.exist;
    });

    it('should show the service units ordered by number', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = new ServiceView(
          {container: container, model: service, db: db,
            env: env, querystring: {}}).render();
      var rendered_names = container.all('div.thumbnail').get('id');
      var expected_names = db.units.map(function(u) {return u.id;});
      expected_names.sort();
      //assert.deepEqual(rendered_names, expected_names);
      rendered_names.should.eql(expected_names);
    });

    it('should start with the proper number of units shown in the text field',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.get('value').should.equal('3');
       });

    it('should remove multiple units when the text input changes',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 1);
         control.simulate('keydown', { keyCode: ENTER }); // Simulate Enter.
         var message = conn.last_message();
         message.op.should.equal('remove_units');
         message.unit_names.should.eql(['mysql/2', 'mysql/1']);
       });

    it('should not do anything if requested is < 1',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 0);
         control.simulate('keydown', { keyCode: ENTER });
         var _ = expect(conn.last_message()).to.not.exist;
         control.get('value').should.equal('3');
       });

    it('should not do anything if the number of units is <= 1',
       function() {
         service.set('unit_count', 1);
         db.units.remove([1, 2]);
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 0);
         control.simulate('keydown', { keyCode: ENTER });
         var _ = expect(conn.last_message()).to.not.exist;
         control.get('value').should.equal('1');
       });

    it('should add the correct number of units when entered via text field',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 7);
         control.simulate('keydown', { keyCode: ENTER });
         var message = conn.last_message();
         message.op.should.equal('add_unit');
         message.service_name.should.equal('mysql');
         message.num_units.should.equal(4);
       });

    it('should add pending units as soon as it gets a reply back ' +
       'from the server',
       function() {
         var new_unit_id = 'mysql/5';
         var expected_names = db.units.map(function(u) {return u.id;});
         expected_names.push(new_unit_id);
         expected_names.sort();
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 4);
         control.simulate('keydown', { keyCode: ENTER });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         // Since we don't have an app to listen to this event and tell the
         // view to re-render, we need to do it ourselves.
         db.on('update', view.render, view);
         callbacks[0]({result: [new_unit_id]});
         var db_names = db.units.map(function(u) {return u.id;});
         db_names.sort();
         db_names.should.eql(expected_names);
         service.get('unit_count').should.equal(4);
         var rendered_names = container.all('div.thumbnail').get('id');
         assert.deepEqual(rendered_names, expected_names);
       });

    it('should remove units as soon as it gets a ' +
       'reply back from the server',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 2);
         control.simulate('keydown', { keyCode: ENTER });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         callbacks[0]({unit_names: ['mysql/2']});
         var _ = expect(db.units.getById('mysql/2')).to.not.exist;
       });

    it('should reset values on the control when you press escape',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 2);
         control.simulate('keydown', { keyCode: ESC });
         control.get('value').should.equal('3');
       });

    it('should reset values on the control when you change focus',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');
         control.set('value', 2);
         control.simulate('blur');
         control.get('value').should.equal('3');
       });

    it('should reset values on the control when you type invalid value',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#num-service-units');

         var pressKey = function(key) {
           control.set('value', key);
           control.simulate('keydown', { keyCode: ENTER });
           control.get('value').should.equal('3');
         };
         pressKey('a');
         pressKey('2w');
         pressKey('w2');
       });

    // Test for destroying services.
    it('should destroy the service when "Destroy Service" is clicked',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         var control = container.one('#destroy-service');
         control.simulate('click');
         var destroy = container.one('#destroy-modal-panel .btn-danger');
         destroy.simulate('click');
         var message = conn.last_message();
         message.op.should.equal('destroy_service');
         destroy.get('disabled').should.equal(true);
       });

    it('should remove the service from the db after server ack',
       function() {
         var view = new ServiceView(
         {container: container, model: service, db: db,
           env: env, querystring: {}}).render();
         db.relations.add(
         [new models.Relation({id: 'relation-0000000000',
            endpoints: [['mysql', {}], ['wordpress', {}]]}),
          new models.Relation({id: 'relation-0000000001',
            endpoints: [['squid', {}], ['apache', {}]]})]);
         var control = container.one('#destroy-service');
         control.simulate('click');
         var destroy = container.one('#destroy-modal-panel .btn-danger');
         destroy.simulate('click');
         var called = false;
         view.on('showEnvironment', function(ev) {
           called = true;
         });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         // Since we don't have an app to listen to this event and tell the
         // view to re-render, we need to do it ourselves.
         db.on('update', view.render, view);
         callbacks[0]({result: true});
         var _ = expect(db.services.getById(service.get('id'))).to.not.exist;
         db.relations.map(function(u) {return u.get('id');})
        .should.eql(['relation-0000000001']);
         // Catch show environment event.
         called.should.equal(true);
       });

    it('should send an expose RPC call when exposeService is invoked',
       function() {
          var view = new ServiceView({
            container: container, model: service, db: db,
            env: env, querystring: {}});

          view.exposeService();
          conn.last_message().op.should.equal('expose');
       });

    it('should send an unexpose RPC call when unexposeService is invoked',
       function() {
          var view = new ServiceView({
            container: container, model: service, db: db,
            env: env, querystring: {}});

          view.unexposeService();
          conn.last_message().op.should.equal('unexpose');
       });

    it('should invoke callback when expose RPC returns',
       function() {
          var view = new ServiceView({
            container: container, model: service, db: db,
            env: env, querystring: {}}).render();

         var test = function(selectorBefore, selectorAfter, callback) {
           console.log('Service is exposed: ' + service.get('exposed'));
           console.log('selectorBefore: ' + selectorBefore);
           console.log('selectorAfter: ' + selectorAfter);

           assert.isNotNull(container.one(selectorBefore));
           assert.isNull(container.one(selectorAfter));

           var dbUpdated = false;
           db.on('update', function() {
             dbUpdated = true;
           });
           callback();
           // In the real code, the view should be updated by the db change
           // event. Here we should call it manually because we have no
           // "route" for this test.
           view.render();

           assert.isTrue(dbUpdated);
           assert.isNotNull(container.one(selectorAfter));
           assert.isNull(container.one(selectorBefore));
         };

         test('.exposeService', '.unexposeService',
              Y.bind(view._exposeServiceCallback, view));
         test('.unexposeService', '.exposeService',
              Y.bind(view._unexposeServiceCallback, view));
       });

    it('should show proper tabs initially', function() {
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {}}).render(),
          active_navtabs = [];
      container.all('ul.nav-tabs li').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(), n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', true],
           ['Running', false],
           ['Pending', false],
           ['Error', false]]);
    });

    it('should show zero running units when filtered', function() {
      // All units are pending.
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'running'}}).render(),
          active_navtabs = [];
      container.all('ul.nav-tabs li').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(), n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', true],
           ['Pending', false],
           ['Error', false]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some running units when filtered', function() {
      db.units.getById('mysql/0').agent_state = 'running';
      // 1 is pending.
      db.units.getById('mysql/2').agent_state = 'running';
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'running'}}).render();
      container.all('div.thumbnail').get('id').should.eql(
          ['mysql/0', 'mysql/2']);
    });

    it('should show zero pending units when filtered', function() {
      db.units.getById('mysql/0').agent_state = 'install-error';
      db.units.getById('mysql/1').agent_state = 'stopping';
      db.units.getById('mysql/2').agent_state = 'running';
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'pending'}}).render(),
          active_navtabs = [];
      container.all('ul.nav-tabs li').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(), n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', false],
           ['Pending', true],
           ['Error', false]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some pending units when filtered', function() {
      // 0 is pending already.
      db.units.getById('mysql/1').agent_state = 'running';
      // We include started and installed with pending.
      db.units.getById('mysql/2').agent_state = 'started';
      db.units.add([{id: 'mysql/3', agent_state: 'installed'}]);
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'pending'}}).render();
      container.all('div.thumbnail').get('id').should.eql(
          ['mysql/0', 'mysql/2', 'mysql/3']);
    });

    it('should show zero error units when filtered', function() {
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'error'}}).render(),
          active_navtabs = [];
      container.all('ul.nav-tabs li').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(), n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', false],
           ['Pending', false],
           ['Error', true]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some error units when filtered', function() {
      // Any -error is included.
      db.units.getById('mysql/0').agent_state = 'install-error';
      // 1 is pending.
      db.units.getById('mysql/2').agent_state = 'foo-error';
      var view = new ServiceView(
          { container: container, model: service, db: db,
            env: env, querystring: {state: 'error'}}).render();
      container.all('div.thumbnail').get('id').should.eql(
          ['mysql/0', 'mysql/2']);
    });

  });
}) ();
