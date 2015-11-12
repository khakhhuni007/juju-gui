/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

YUI.add('search-results-item', function(Y) {

  juju.components.SearchResultsItem = React.createClass({
    /**
      Generate the element for the special flag.

      @method _generateSpecialFlag
      @returns {String} The generated elements.
    */
    _generateSpecialFlag: function() {
      var special = this.props.item.special;
      if (!special) {
        return;
      }
      return (
          <span className="special-flag"></span>
      );
    },

    /**
      Generate the elements for the tag list.

      @method _generateTagList
      @returns {String} The generated elements.
    */
    _generateTagList: function() {
      var components = [];
      var tags = this.props.item.tags || [];
      if (tags.length === 0) {
        return <span>&nbsp;</span>;
      }
      tags.forEach(function(tag) {
        components.push(
          <li className="tag-list--item"
            key={tag}
            role="button" tabIndex="0"
            onClick={this._handleTagClick.bind(this, tag)}>
            {tag}
          </li>
        );
      }, this);
      return components;
    },

    /**
      Generate the elements for the series list.

      @method _generateSeriesList
      @returns {String} The generated elements.
    */
    _generateSeriesList: function() {
      var series = this.props.item.series;
      var components = [];
      if (series.length === 0) {
        return <span>&nbsp;</span>;
      }
      series.forEach(function(item) {
        var name = item.name;
        components.push(
          <li className="tag-list--item"
            key={name}
            role="button" tabIndex="0"
            onClick={this._handleSeriesClick.bind(this, name)}>
            {name}
          </li>
        );
      }, this);
      return (
        <ul className="tag-list tag-list--spaced">
          {components}
        </ul>
      );
    },

    /**
      Generate the elements for the icon list.

      @method _generateIconList
      @returns {String} The generated elements.
    */
    _generateIconList: function() {
      var services = this.props.item.services || [];
      var components = [];
      if (services.length === 0) {
        services.push(this.props.item);
      }
      services.forEach(function(service) {
        var src = service.iconPath ||
            'juju-ui/assets/images/non-sprites/charm_160.svg';
        // TODO: figure out how to get the service id.
        components.push(
          <li className="list-icons__item"
            key={service.displayName}
            role="button" tabIndex="0"
            onClick={this._handleItemClick.bind(this, service.id)}>
            <p>
              <span className="tip">
                <img src={src}
                  className="list-icons__image"
                  alt={service.displayName} />
                <span className="tip-content"
                  data-tooltip={service.displayName}></span>
              </span>
            </p>
          </li>
        );
      }, this);
      return components;
    },

    /**
      Generate the base classes from the props.

      @method _generateClasses
      @param {Boolean} selected Whether the filter is selected.
      @returns {String} The collection of class names.
    */
    _generateClasses: function(selected) {
      return classNames(
        {selected: selected}
      );
    },

    /**
      Show the entity details when clicked.

      @method _handleEntityClick
      @param {String} id The entity id.
      @param {Object} e The click event.
    */
    _handleItemClick: function(id, e) {
      console.log(id);
      e.stopPropagation();
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: id
          }
        }
      });
    },

    /**
      Filter by the given tag.

      @method _handleTagClick
      @param {String} tag The tag name.
      @param {Object} e The click event.
    */
    _handleTagClick: function(tag, e) {
      e.stopPropagation();
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            tags: tag
          }
        }
      });
    },

    /**
      Filter by the given series.

      @method _handleSeriesClick
      @param {String} series The series name.
      @param {Object} e The click event.
    */
    _handleSeriesClick: function(series, e) {
      e.stopPropagation();
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            series: series
          }
        }
      });
    },

    render: function() {
      var item = this.props.item;
      return (
        <li className="list-block__list--item {item.type}"
            tabIndex="0" role="button"
            onClick={this._handleItemClick.bind(this, item.storeId)}>
          <div className="four-col charm-name__column">
            <h3 className="list-block__list--item-title">
              {item.displayName}
              {this._generateSpecialFlag()}
            </h3>
            <ul className="tag-list">
              {this._generateTagList()}
            </ul>
          </div>
          <div className="two-col series__column">
            {this._generateSeriesList()}
          </div>
          <div className="three-col charm-logos__column list-block__column">
            <ul className="list-icons clearfix">
              {this._generateIconList()}
            </ul>
          </div>
          <div className="one-col deploys__column list-block__column">
            <p className="cell">
              <span className="tip">
                <span>{item.downloads}</span>
                <span className="tip-content"
                  data-tooltip={item.downloads + ' deploys'}></span>
              </span>
            </p>
          </div>
          <div className="two-col owner__column list-block__column last-col">
            <p className="cell">
              {item.owner || 'No owner'}
            </p>
          </div>
        </li>
      );
    }
  });

}, '0.1.0', {requires: []});
