/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('MachineViewColumn', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-column', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var menuItems = [];
    var toggle = {};
    var dropUnit = sinon.stub();
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewColumn.DecoratedComponent
        acl={acl}
        activeMenuItem="name"
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        dropUnit={dropUnit}
        isOver={false}
        menuItems={menuItems}
        title="Sandbox"
        toggle={toggle}
        type="machine">
        <div>contents</div>
      </juju.components.MachineViewColumn.DecoratedComponent>);
    var expected = (
      <div className="machine-view__column">
        <juju.components.MachineViewHeader
          acl={acl}
          activeMenuItem="name"
          droppable={true}
          dropUnit={dropUnit}
          menuItems={menuItems}
          title="Sandbox"
          toggle={toggle}
          type="machine" />
        <div className="machine-view__column-content">
          <div>contents</div>
          <div className="machine-view__column-drop-target">
            <juju.components.SvgIcon name="add_16"
              size="16" />
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render in droppable mode', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewColumn.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={true}
        title="Sandbox"
        type="machine" />);
    var expected = (
        <div className="machine-view__column machine-view__column--drop">
          {output.props.children}
        </div>);
    assert.deepEqual(output, expected);
  });

  it('can render in drop mode', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewColumn.DecoratedComponent
        acl={acl}
        canDrop={true}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        title="Sandbox"
        type="machine" />);
    var expected = (
        <div className="machine-view__column machine-view__column--droppable">
          {output.props.children}
        </div>);
    assert.deepEqual(output, expected);
  });
});
