/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Clipboard = require('clipboard');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

const {SvgIcon} = require('@canonical/juju-react-components');

require('./_copy-to-clipboard.scss');

class CopyToClipboard extends React.Component {
  constructor() {
    super();
    this.clipboard = null;
  }

  componentDidMount() {
    var node = ReactDOM.findDOMNode(this).querySelector('button');
    this.clipboard = new Clipboard(node, {
      target: trigger => {
        this.props.analytics.addCategory(this).sendEvent(
          this.props.analytics.CLICK, {label: `entity: ${this.props.value}`});
        return this.refs.input;
      }
    });
  }

  componentWillUnmount() {
    this.clipboard.destroy();
  }

  render() {
    var className = this.props.className;
    return (
      <div className={className}>
        <input
          className={className + '__input'}
          readOnly={true}
          ref="input"
          type="text"
          value={this.props.value} />
        <span className="v1">
          <button
            className={className + '__btn'}
            ref="btn">
            <SvgIcon
              name="copy-to-clipboard-16"
              size="16" />
          </button>
        </span>
      </div>
    );
  }
};

CopyToClipboard.propTypes = {
  analytics: PropTypes.object.isRequired,
  className: PropTypes.string,
  value: PropTypes.string.isRequired
};

CopyToClipboard.defaultProps = {
  className: 'copy-to-clipboard',
  value: ''
};

module.exports = CopyToClipboard;
