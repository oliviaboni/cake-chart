// http://codepen.io/maydie/details/OVmxZZ

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getAnglePoint from '../utils/getAnglePoint';

export default class Slice extends Component {
  static propTypes = {
    angleRange: PropTypes.shape({
      start: PropTypes.number.isRequired,
      end: PropTypes.number.isRequired
    }),
    sliceRadiusRange: PropTypes.shape({
      start: PropTypes.number.isRequired,
      end: PropTypes.number.isRequired
    }),
    stroke: PropTypes.string,
    fill: PropTypes.string,
    strokeWidth: PropTypes.number,
    className: PropTypes.string,
    onClick: PropTypes.func,
    node: PropTypes.any
  }

  static defaultProps = {
    strokeWidth: 3
  }

  state = { hovering: false };

  drawPath () {
    const { angleRange, sliceRadiusRange } = this.props;

    const angle = angleRange.end - angleRange.start;
    const startRadius = sliceRadiusRange.start;
    const endRadius = sliceRadiusRange.end;

    // Get angle points
    const a = getAnglePoint(angleRange.start, angleRange.end, endRadius, 0, 0);
    const b = getAnglePoint(angleRange.start, angleRange.end, startRadius, 0, 0);

    return [
      `M${a.x1},${a.y1}`,
      `A${endRadius},${endRadius} 0 ${(angle > 180 ? 1 : 0)},1 ${a.x2},${a.y2}`,
      (angle < 360) ? `L${b.x2},${b.y2}` : `M${b.x2},${b.y2}`,
      (startRadius > 0) ?
        `A${startRadius},${startRadius} 0 ${(angle > 180 ? 1 : 0)},0 ${b.x1},${b.y1}` :
        '',
      'Z'
    ].join(' ');
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16), // r
        parseInt(result[2], 16), // g
        parseInt(result[3], 16) // b
    ] : null;
  }

  darkenColor(color) {
    let rgb = color;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      rgb = this.hexToRgb(color) // convert hex colors
    }

    let new_rgb = rgb.map((col) => Math.round(parseFloat(col) - 20));
    new_rgb.join(', ');
    return `rgb(${ new_rgb})`;
  }

  render () {
    const { stroke, strokeWidth, className, node } = this.props;
    const fill = this.state.hovering ? this.darkenColor(this.props.fill) : this.props.fill;
    return (
      <g>
      <path d={this.drawPath()}
            onClick={this.handleClick}
            onMouseEnter={this.handleStartHover}
            onMouseLeave={this.handleEndHover}
            {...{ fill, stroke, strokeWidth, className }} />
        <path>{node.value}</path>
      </g>
    );
  }

  handleClick = () => {
    this.props.onClick && this.props.onClick(this.props.node);
  }

  handleStartHover = () => {
    this.setState({ hovering: true });
    this.props.onHover && this.props.onHover(this.props.node);
  };

  handleEndHover = () => {
    this.setState({ hovering: false });
    this.props.onHover && this.props.onHover();
  };
}
