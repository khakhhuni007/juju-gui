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

YUI.add('deployment-bar', function() {

  juju.components.DeploymentBar = React.createClass({
    propTypes: {
      exportEnvironmentFile: React.PropTypes.func.isRequired
    },

    previousNotifications: [],

    /**
      Get the current state of the deployment bar.

      @method getInitialState
      @returns {Object} The current state.
    */
    getInitialState: function() {
      return {
        latestChangeDescription: null
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this._updateLatestChange(nextProps.currentChangeSet);
    },

    /**
      Update the state with the latest change if it has changed.

      @method _updateLatestChange
      @param {Object} currentChangeSet The collection of ecs changes.
    */
    _updateLatestChange: function(changeSet) {
      var keys = Object.keys(changeSet);
      var latestChange = keys[keys.length - 1];
      var previousIndex = this.previousNotifications.indexOf(latestChange);
      if (latestChange && previousIndex === -1) {
        var change = changeSet[latestChange];
        this.previousNotifications.push(latestChange);
        this.setState({
          latestChangeDescription: this.props.generateChangeDescription(change)
        });
      }
    },

    /**
      Get the label for the deploy button.

      @method _getDeployButtonLabel
      @param {Boolean} hasCommits Does the env have commits.
      @returns {String} the label for the deploy button
    */
    _getDeployButtonLabel: function(hasCommits) {
      return hasCommits ? 'Commit changes' : 'Deploy changes';
    },

    /**
      Export the env when the button is clicked.

      @method _handleExport
      @returns {String} the label for the deploy button
    */
    _handleExport: function() {
      this.props.exportEnvironmentFile();
    },

    render: function() {
      var changeCount = Object.keys(this.props.currentChangeSet).length;
      return (
        <juju.components.Panel
          instanceName="deployment-bar-panel"
          visible={true}>
          <span className="deployment-bar__export link"
            onClick={this._handleExport}
            role="button"
            tabIndex="0">
            Export
          </span>
          <juju.components.DeploymentBarNotification
            change={this.state.latestChangeDescription} />
          <juju.components.GenericButton
            action={this.props.deployButtonAction}
            type="blue"
            disabled={changeCount === 0}
            title={changeCount} />
          <juju.components.GenericButton
            action={this.props.deployButtonAction}
            type="confirm"
            disabled={changeCount === 0}
            title={this._getDeployButtonLabel(this.props.hasCommits)} />
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-bar-notification',
  'panel-component'
]});
