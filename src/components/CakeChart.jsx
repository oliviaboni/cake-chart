// http://codepen.io/maydie/details/OVmxZZ

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getTextCoordinates from '../utils/getTextCoordinates';
import createSliceTree from '../utils/createSliceTree';
import Ring from './Ring';
import jss from 'jss';
import JssVendorPrefixer from 'jss-vendor-prefixer';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import getSliceRadiusRange from '../utils/getSliceRadiusRange';
import getDefaultColor from '../utils/getDefaultColor';
import classNames from 'classnames';
import { sheet, createDefaultSheets } from '../utils/defaultSheets';
import useSheet from 'react-jss';
import throttle from 'lodash.throttle';

jss.use(JssVendorPrefixer);

let ringSheet = null;
let ringTransitionSheet = null;

function detachRingSheets() {
  if (ringSheet) {
    ringSheet.detach();
  }

  if (ringTransitionSheet) {
    ringTransitionSheet.detach();
  }
}

function attachRingSheets(props) {
  detachRingSheets();
  const { sheet: { classes } } = props;
  const {
    transitionName = classes.pieChart,
    labelTransitionName = classes.labelsBox,
    className = classes.wrapper
  } = props;

  [ ringSheet, ringTransitionSheet ] = createDefaultSheets({
    ...props,
    transitionName, labelTransitionName, className
  });

  ringSheet.attach();
  ringTransitionSheet.attach();
}

function getDefaultLabel(slice) {
  return (slice.end - slice.start > 15) && (slice.node.label || slice.node.value);
}

function getDefaultLabelProps(slice, idx, center, props, classes) {
  const { coreRadius, ringWidth, ringWidthFactor } = props;
  const pos = getTextCoordinates(slice, coreRadius, ringWidth, center, ringWidthFactor);
  const hasChildren = slice.node.children && slice.node.children.length;
  const className = classNames({
    [classes.label]: true,
    [classes.labelActive]: hasChildren
  });
  const label = getDefaultLabel(slice);
  const onClick = props.onClick
    ? () => { props.onClick(null, slice.node) }
    : null;

  return {
    className,
    style: {
      left: pos.x + '%',
      top: pos.y + '%',
      background: slice.node.color || getDefaultColor(slice.level, idx),
      display: label ? 'block' : 'none'
    },
    key: slice.level + '-' + idx,
    onClick: onClick,
  }
}

function getDefaultKey(node) {
  return node.key || (node.label + '-' + node.value);
}

@useSheet(sheet, { link: true })
export default class CakeChart extends Component {
  static propTypes = {
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    onClick: PropTypes.func,

    data: PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.any,
      color: PropTypes.string,
      children: PropTypes.array
    }).isRequired,

    coreRadius: PropTypes.number,
    ringWidth: PropTypes.number,
    ringWidthFactor: PropTypes.number,
    limit: PropTypes.number,
    transitionName: PropTypes.string,
    labelTransitionName: PropTypes.string,
    className: PropTypes.string,
    getLabelComponent: PropTypes.func
  };

  static defaultProps = {
    limit: 5,
    strokeWidth: 3,
    stroke: '#FFFFFF',
    ringWidthFactor: 0.7,
    coreRadius: 100,
    ringWidth: 200,
    getRingProps: (block, props) => props,
    getSliceProps: (slice, idx, props) => props,
    getLabelProps: (slice, idx, props) => props,
    getLabel: (slice, label) => label,
    getKey: (node, key) => key
  };

  state = { node: null, hovering: false };
  labels = React.createRef();
  container = React.createRef();

  componentWillMount() {
    attachRingSheets(this.props);
  }

  componentDidMount() {
    window.addEventListener('resize', this.debouncedWindowResize);
    this.updateLabelsSize();
  }

  componentWillUpdate(nextProps) {
    if (nextProps.limit !== this.props.limit) {
      attachRingSheets(nextProps);
    }
    this.updateLabelsSize();
  }

  componentWillUnount() {
    detachRingSheets();
    window.removeEventListener('resize', this.debouncedWindowResize);
  }

  handleWindowResize = () => {
    window.requestAnimationFrame(this.updateLabelsSize);
  };

  debouncedWindowResize = throttle(this.handleWindowResize, 50);

  updateLabelsSize = () => {
    const labelsEl = this.labels.current;
    const containerEl = this.container.current;
    if (this.labels && this.labels.current && this.container.current) {
      const size = Math.min(containerEl.offsetHeight, containerEl.offsetWidth);
      labelsEl.style.height = size + 'px';
      labelsEl.style.width = size + 'px';
    }
  };

  handleStartHover = () => { this.setState({ hovering: true })};
  handleEndHover = () => { this.setState({ hovering: false })};
  handleNodeHover = (node) => {
    this.setState({ node })
  };

  render() {
    const { sheet: { classes } } = this.props;
    const { node } = this.state;
    const { coreRadius, ringWidth, onClick, getRingProps, getSliceProps,
            style, data, getKey, stroke, strokeWidth, limit, ringWidthFactor,
            transitionName = classes.pieChart,
            labelTransitionName = classes.labelsBox,
            className = classes.wrapper } = this.props;
    const center = getSliceRadiusRange(coreRadius, ringWidth, limit, ringWidthFactor).end;
    const diameter = center * 2;
    const sliceTree = createSliceTree(data, limit);
    const centerRule = jss.createRule({
      transform: `translate(${center}px, ${center}px)`
    });
    const key = getKey(data, getDefaultKey(data));

    return (
      <div className={className}
           style={style}
           ref={this.container}>
        <div className={classes.labels}>
          <CSSTransitionGroup component='div'
                              className={classes.labelsTransition}
                              transitionName={labelTransitionName}
                              transitionAppear={true}>
            {sliceTree.map((block, idx) =>
              this.renderTexts(block, center, `${idx}-${key}`)
            )}
          </CSSTransitionGroup>
        </div>
        <svg width='100%'
             height='100%'
             viewBox={`0 0 ${diameter} ${diameter}`}
             xmlns='http://www.w3.org/2000/svg'
             version='1.1'
             className={classes.svg}>
          <g style={centerRule.style}
             onMouseEnter={this.handleStartHover}
             onMouseLeave={this.handleEndHover}
          >
            <CSSTransitionGroup component={'g'}
                                transitionName={transitionName}
                                transitionAppear={true}>
              {sliceTree.map((block, idx) =>
                <Ring {...getRingProps(block, {
                  key: `${idx}-${key}`,
                  className: ringSheet.classes['ring-' + block.level],
                  slices: block.slices,
                  level: block.level,
                  sliceRadiusRange: getSliceRadiusRange(
                    coreRadius,
                    ringWidth,
                    block.level,
                    ringWidthFactor
                  ),
                  center, getSliceProps,
                  stroke, strokeWidth, onClick,
                  onHover: this.handleNodeHover
                })} />
              )}
            </CSSTransitionGroup>
          </g>
        </svg>
        { node &&
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: 10,
            display: 'inline-block',
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 1,
          }}>
            { node.label }: { node.value }
          </div>
        }
      </div>
    );
  }

  renderTexts(block, center, key) {
    const { getLabelProps, getLabel, sheet: { classes } } = this.props;

    return (
      <div key={key}
           style={{visibility: this.state.hovering ? 'hidden' : 'visible'}}
           className={ringSheet.classes['labels-' + block.level]}
           ref={this.labels}>{
        block.slices.map(slice =>
          <div {...getLabelProps(
            slice, block.slices.indexOf(slice),
            getDefaultLabelProps(
              slice,
              block.slices.indexOf(slice),
              center,
              this.props,
              classes
            ),
          )}>
            {getLabel(slice, getDefaultLabel(slice))}
          </div>
        )
      }
      </div>
    );
  }
}
