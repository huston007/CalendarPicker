/**
 * Calendar Picker Component
 *
 * Copyright 2016 Yahoo Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in the project root for terms.
 */
'use strict';

import React, {Component} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity
} from 'react-native';

var {
  WEEKDAYS,
  MONTHS,
  MAX_ROWS,
  MAX_COLUMNS,
  getDaysInMonth
} = require('./Util');

var makeStyles = require('./makeStyles');

//The styles in makeStyles are intially scaled to this width
const IPHONE6_WIDTH = 375;
var initialScale = Dimensions.get('window').width / IPHONE6_WIDTH ;
var styles = StyleSheet.create(makeStyles(initialScale));

class Day extends Component {
  static propTypes = {
    onDayChange: React.PropTypes.func,
    selected: React.PropTypes.bool,
    day: React.PropTypes.oneOfType([
      React.PropTypes.number,
      React.PropTypes.string
    ]).isRequired,
    screenWidth: React.PropTypes.number,
    startFromMonday: React.PropTypes.bool,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string
  };

  static defaultProps = {
    onDayChange () {}
  };

  constructor(props) {
    super(props);
    this.DAY_WIDTH = (props.screenWidth - 16)/7;
    this.SELECTED_DAY_WIDTH = (props.screenWidth - 16)/7 - 10;
    this.BORDER_RADIUS = this.SELECTED_DAY_WIDTH/2;
    this.state = null;
  }

  render() {
    if (this.props.selected) {
      var selectedDayColorStyle = this.props.selectedDayColor ? {backgroundColor: this.props.selectedDayColor} : {};
      var selectedDayTextColorStyle = this.props.selectedDayTextColor ? {color: this.props.selectedDayTextColor} : {};
      return (
        <View style={styles.dayWrapper}>
          <View style={[styles.dayButtonSelected, selectedDayColorStyle]}>
            <TouchableOpacity
              style={styles.dayButton}
              onPress={() => this.props.onDayChange(this.props.day) }>
              <Text style={[styles.dayLabel, selectedDayTextColorStyle]}>
                {this.props.day.toString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.dayWrapper}>
          <TouchableOpacity
            style={styles.dayButton}
            onPress={() => this.props.onDayChange(this.props.day) }>
            <Text style={styles.dayLabel}>
              {this.props.day.toString()}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }
}

class Days extends Component {
  static propTypes = {
    date: React.PropTypes.instanceOf(Date).isRequired,
    month: React.PropTypes.number.isRequired,
    year: React.PropTypes.number.isRequired,
    onDayChange: React.PropTypes.func.isRequired,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string
  };

  state = {
    selectedStates: []
  };

  componentDidMount() {
    this.updateSelectedStates(this.props.date.getDate());
  }

  updateSelectedStates = (day) => {
    var selectedStates = [],
      daysInMonth = getDaysInMonth(this.props.month, this.props.year),
      i;

    for (i = 1; i <= daysInMonth; i++) {
      if (i === day) {
        selectedStates.push(true);
      } else {
        selectedStates.push(false);
      }
    }

    this.setState({
      selectedStates: selectedStates
    });

  };

  onPressDay = (day) => {
    this.updateSelectedStates(day);
    this.props.onDayChange({day: day});
  };

  // Not going to touch this one - I'd look at whether there is a more functional
  // way you can do this using something like `range`, `map`, `partition` and such
  // (see underscore.js), or just break it up into steps: first generate the array for
  // data, then map that into the components
  getCalendarDays = () => {
    var columns,
      matrix = [],
      i,
      j,
      month = this.props.month,
      year = this.props.year,
      currentDay = 0,
      thisMonthFirstDay = this.props.startFromMonday ? new Date(year, month, 0) : new Date(year, month, 1),
      slotsAccumulator = 0;

    for (i = 0; i < MAX_ROWS; i++ ) { // Week rows
      columns = [];

      for (j = 0; j < MAX_COLUMNS; j++) { // Day columns
        if (slotsAccumulator >= thisMonthFirstDay.getDay()) {
          if (currentDay < getDaysInMonth(month, year)) {
            columns.push(<Day
                      key={j}
                      day={currentDay+1}
                      selected={this.state.selectedStates[currentDay]}
                      date={this.props.date}
                      onDayChange={this.onPressDay}
                      screenWidth={this.props.screenWidth}
                      selectedDayColor={this.props.selectedDayColor}
                      selectedDayTextColor={this.props.selectedDayTextColor}  />);
            currentDay++;
          }
        } else {
          columns.push(<Day
                            key={j}
                            day={''}
                            screenWidth={this.props.screenWidth}/>);
        }

        slotsAccumulator++;
      }
      matrix[i] = [];
      matrix[i].push(<View style={styles.weekRow}>{columns}</View>);
    }

    return matrix;
  };

  render() {
    return <View style={styles.daysWrapper}>{ this.getCalendarDays() }</View>;
  }
}

class WeekDaysLabels extends Component {
  static propTypes = {
    screenWidth: React.PropTypes.number
  };

  constructor(props) {
    super(props);
    this.DAY_WIDTH = (props.screenWidth - 16)/7;
    this.state = null;
  }

  render() {
    return (
      <View style={styles.dayLabelsWrapper}>
        { (this.props.weekdays || WEEKDAYS).map((day, key) => { return <Text key={key} style={styles.dayLabels}>{day}</Text>; }) }
      </View>
    );
  }
}

class HeaderControls extends Component {
  static propTypes = {
    month: React.PropTypes.number.isRequired,
    getNextYear: React.PropTypes.func.isRequired,
    getPrevYear: React.PropTypes.func.isRequired,
    onMonthChange: React.PropTypes.func.isRequired
  };

  state = {
    selectedMonth: this.props.month
  };

  // Logic seems a bit awkawardly split up between here and the CalendarPicker
  // component, eg: getNextYear is actually modifying the state of the parent,
  // could just let header controls hold all of the logic and have CalendarPicker
  // `onChange` callback fire and update itself on each change
  getNext = () => {
    var next = this.state.selectedMonth + 1;
    if (next > 11) {
      this.setState({ selectedMonth: 0 });
      this.props.getNextYear();
    } else {
      this.setState({ selectedMonth: next });
    }
    this.props.onMonthChange(next);
  };

  getPrevious = () => {
    var prev = this.state.selectedMonth - 1;
    if (prev < 0) {
      this.setState({ selectedMonth: 11 });
      this.props.getPrevYear();
    } else {
      this.setState({ selectedMonth: prev });
    }
    this.props.onMonthChange(prev);
  };

  render() {
    return (
      <View style={styles.headerWrapper}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={this.getPrevious}>
            <Text style={styles.prev}>{this.props.previousTitle || 'Previous'}</Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text style={styles.monthLabel}>
            { (this.props.months || MONTHS)[this.state.selectedMonth] } { this.props.year }
          </Text>
        </View>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={this.getNext}>
            <Text style={styles.next}>{this.props.nextTitle || 'Next'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  }
}

class CalendarPicker extends Component {
  static propTypes = {
    selectedDate: React.PropTypes.instanceOf(Date).isRequired,
    onDateChange: React.PropTypes.func,
    screenWidth: React.PropTypes.number,
    selectedBackgroundColor: React.PropTypes.string,
    styleSelectedDayText: Text.propTypes.style,
    startFromMonday: React.PropTypes.bool,
    weekdays: React.PropTypes.array,
    months: React.PropTypes.array,
    previousTitle: React.PropTypes.string,
    nextTitle: React.PropTypes.string,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string,
    scaleFactor: React.PropTypes.number,
    overrideStyles: React.PropTypes.object,
    dontChangeDateOnCalendarMovement: React.PropTypes.bool
  };

  static defaultProps = {
    onDateChange () {},
    dontChangeDateOnCalendarMovement: false
  };

  constructor(props) {
    super(props);
    if (props.scaleFactor !== undefined || props.overrideStyles !== undefined) {
      styles = StyleSheet.create(makeStyles(props.scaleFactor, props.overrideStyles));
    }

    this.state = {
      date: props.selectedDate,
      day: props.selectedDate.getDate(),
      month: props.selectedDate.getMonth(),
      year: props.selectedDate.getFullYear(),
      selectedDay: []
    };
  }

  onDayChange = (day) => {
    this.setState({day: day.day}, () => {this.onDateChange(this.props.dontChangeDateOnCalendarMovement);});
  };

  onMonthChange = (month) => {
    this.setState({month: month}, () => this.onDateChange(this.props.dontChangeDateOnCalendarMovement));
  };

  getNextYear = () => {
    this.setState({year: this.state.year + 1}, () => this.onDateChange(this.props.dontChangeDateOnCalendarMovement));
  };

  getPrevYear = () => {
    this.setState({year: this.state.year - 1}, () => this.onDateChange(this.props.dontChangeDateOnCalendarMovement));
  };

  onDateChange = (silent=false) => {
    var {
      day,
      month,
      year
    } = this.state,
      date = new Date(year, month, day);

    if(silent) {
      return;
    }
    this.setState({date: date});
    this.props.onDateChange(date);
  };

  simulateDateClick = (day) => {
    this.refs.days.onPressDay(day);
  };

  render() {
    return (
      <View style={styles.calendar}>
        <HeaderControls
          year={this.state.year}
          month={this.state.month}
          onMonthChange={this.onMonthChange}
          getNextYear={this.getNextYear}
          getPrevYear={this.getPrevYear}
          months={this.props.months}
          previousTitle={this.props.previousTitle}
          nextTitle={this.props.nextTitle} />

        <WeekDaysLabels
          screenWidth={this.props.screenWidth}
          weekdays={this.props.weekdays}/>

        <Days
          month={this.state.month}
          year={this.state.year}
          date={this.state.date}
          onDayChange={this.onDayChange}
          screenWidth={this.props.screenWidth}
          selectedBackgroundColor={this.props.selectedBackgroundColor}
          styleSelectedDayText={this.props.styleSelectedDayText}
          startFromMonday={this.props.startFromMonday}
          selectedDayColor={this.props.selectedDayColor}
          selectedDayTextColor={this.props.selectedDayTextColor}
          ref='days'/>
      </View>
    );
  }
}

module.exports = CalendarPicker;
