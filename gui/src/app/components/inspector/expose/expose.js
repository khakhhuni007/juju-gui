/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BooleanConfig = require('../../boolean-config/boolean-config');
const InspectorExposeUnit = require('./unit/unit');

require('./_expose.scss');

class InspectorExpose extends React.Component {
  constructor(props) {
    super(props);
    this.analytics = this.props.analytics.addCategory('Expose');
  }

  componentDidMount() {
    this.analytics.sendEvent(this.props.analytics.VIEW);
  }

  /**
    The callable to be passed to the unit items for navigating to the unit
    details.

    @method _unitItemAction
    @param {Object} e The click event.
  */
  _unitItemAction(e) {
    var unitId = e.currentTarget.getAttribute('data-id').split('/')[1];
    this.props.changeState({
      gui: {
        inspector: {
          id: this.props.service.get('id'),
          unit: unitId,
          activeComponent: 'unit'
        }
      }
    });
    this.analytics.addCategory('Unit').sendEvent(this.props.analytics.CLICK);
  }

  /**
    Generate a list of units for the service.

    @method _generateUnits
    @returns {Array} A list of units.
  */
  _generateUnits() {
    var units = [];
    this.props.units.toArray().forEach(function(unit) {
      units.push(
        <InspectorExposeUnit
          action={this._unitItemAction.bind(this)}
          key={unit.id}
          unit={unit} />);
    }, this);
    return units;
  }

  /**
    Display a list of units if the service is exposed.

    @method _displayUnitList
    @returns {Object} A list of units.
  */
  _displayUnitList() {
    if (!this.props.service.get('exposed')) {
      return;
    }
    return (
      <ul className="inspector-expose__units">
        {this._generateUnits()}
      </ul>);
  }

  /**
    Expose the service when toggled.

    @method _handleExposeChange
  */
  _handleExposeChange() {
    var service = this.props.service;
    var serviceId = service.get('id');
    const exposed = service.get('exposed');
    if (exposed) {
      this.props.modelAPI.unexposeService(serviceId,
        this._exposeServiceCallback.bind(this), {});
    } else {
      this.props.modelAPI.exposeService(serviceId,
        this._exposeServiceCallback.bind(this), {});
    }
    this.analytics.sendEvent(this.props.analytics.UPDATE, {label: `exposed: ${exposed}`});
  }

  /**
    Callback to handle errors when exposing a service.

    @method _exposeServiceCallback
    @param {object} e The expose event
  */
  _exposeServiceCallback(e) {
    if (e.err) {
      console.error(e.err);
      this.props.addNotification({
        title: 'Exposing charm failed',
        message: 'The application' + this.props.service.get('name') +
          ' failed to expose:' + e.err,
        level: 'error'
      });
    }
  }

  render() {
    var toggle = {
      key: 'expose-toggle'
    };
    return (
      <div className="inspector-expose">
        <div className="inspector-expose__control">
          <BooleanConfig
            config={this.props.service.get('exposed')}
            disabled={this.props.acl.isReadOnly()}
            key={toggle.key}
            label="Expose application"
            onChange={this._handleExposeChange.bind(this)}
            option={toggle}
            ref={toggle.key} />
        </div>
        <p className="inspector-expose__warning">
            Exposing this application may make it publicly accessible from
            the web
        </p>
        {this._displayUnitList()}
      </div>
    );
  }
};

InspectorExpose.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  analytics: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  modelAPI: shapeup.shape({
    exposeService: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    unexposeService: PropTypes.func.isRequired
  }).isRequired,
  service: PropTypes.object.isRequired,
  units: PropTypes.object.isRequired
};

module.exports = InspectorExpose;
