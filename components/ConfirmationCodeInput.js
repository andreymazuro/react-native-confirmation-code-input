import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet, Dimensions, ViewPropTypes, Text } from 'react-native';
import _ from 'lodash';

// if ViewPropTypes is not defined fall back to View.propType (to support RN < 0.44)
const viewPropTypes = ViewPropTypes || View.propTypes;

export default class ConfirmationCodeInput extends Component {
  static propTypes = {
    codeLength: PropTypes.number,
    compareWithCode: PropTypes.string,
    inputPosition: PropTypes.string,
    size: PropTypes.number,
    space: PropTypes.number,
    className: PropTypes.string,
    cellBorderWidth: PropTypes.number,
    activeColor: PropTypes.string,
    inactiveColor: PropTypes.string,
    ignoreCase: PropTypes.bool,
    autoFocus: PropTypes.bool,
    codeInputStyle: TextInput.propTypes.style,
    containerStyle: viewPropTypes.style,
    onFulfill: PropTypes.func,
  };

  static defaultProps = {
    codeLength: 5,
    inputPosition: 'center',
    autoFocus: true,
    size: 40,
    className: 'border-box',
    cellBorderWidth: 1,
    activeColor: 'rgba(255, 255, 255, 1)',
    inactiveColor: 'rgba(255, 255, 255, 0.2)',
    space: 8,
    compareWithCode: '',
    ignoreCase: false
  };

  constructor(props) {
    super(props);

    this.state = {
      codeArr: new Array(this.props.codeLength).fill(''),
      currentIndex: 0
    };

    this.codeInputRefs = [];
  }

  componentDidMount() {
    const { compareWithCode, codeLength, inputPosition } = this.props;
    if (compareWithCode && compareWithCode.length !== codeLength) {
      console.error("Invalid props: compareWith length is not equal to codeLength");
    }

    if (_.indexOf(['center', 'left', 'right', 'full-width'], inputPosition) === -1) {
      console.error('Invalid input position. Must be in: center, left, right, full');
    }
  }

  clear() {
    this.setState({
      codeArr: new Array(this.props.codeLength).fill(''),
      currentIndex: 0
    });
    this._setFocus(0);
  }

  _setFocus(index) {
    this.codeInputRefs[index].focus();
  }

  _onFocus(index) {
    let newCodeArr = _.clone(this.state.codeArr);
    const currentEmptyIndex = _.findIndex(newCodeArr, c => !c);
    if (currentEmptyIndex !== -1 && currentEmptyIndex < index) {
      return this._setFocus(currentEmptyIndex);
    }
    for (const i in newCodeArr) {
      if (i >= index) {
        newCodeArr[i] = '';
      }
    }

    this.setState({
      codeArr: newCodeArr,
      currentIndex: index
    })
  }

  _isMatchingCode(code, compareWithCode, ignoreCase = false) {
    if (ignoreCase) {
      return code.toLowerCase() == compareWithCode.toLowerCase();
    }
    return code == compareWithCode;
  }

  _getContainerStyle(size, position) {
    switch (position) {
      case 'left':
        return {
          justifyContent: 'flex-start',
          height: size
        };
      case 'center':
        return {
          justifyContent: 'center',
          height: size
        };
      case 'right':
        return {
          justifyContent: 'flex-end',
          height: size
        };
      default:
        return {
          justifyContent: 'space-between',
          height: size
        }
    }
  }

  _getInputSpaceStyle(space) {
    const { inputPosition } = this.props;
    switch (inputPosition) {
      case 'left':
        return {
          marginRight: space
        };
      case 'center':
        return {
          marginRight: space/2,
          marginLeft: space/2
        };
      case 'right':
        return {
          marginLeft: space
        };
      default:
        return {
          marginRight: 0,
          marginLeft: 0
        };
    }
  }

  _getClassStyle(className, active, id) {
    const { cellBorderWidth, activeColor, inactiveColor, space } = this.props;
    let classStyle = {
      ...this._getInputSpaceStyle(space),
      color: activeColor
    };

    return _.merge(classStyle, {
      borderBottomWidth: cellBorderWidth,
      borderColor: (active || this.state.codeArr[id] !== '') ? activeColor : inactiveColor,
    });
  }

  _onKeyPress(e, id) {
    if (e.nativeEvent.key === 'Backspace') {
      this.props.onChange()
      if (Math.abs(this.lastKeyEventTimestamp - e.timeStamp) < 20) return;
      const { currentIndex } = this.state;
      if (this.state.codeArr.filter(i => i !== '').length === this.props.codeLength) {
        let codeArr = this.state.codeArr
        codeArr[id] = ''
        return this.setState({ codeArr })
      }
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      this._setFocus(nextIndex);
    } else {
      this.state.codeArr.filter(i => i !== '').length !== this.props.codeLength && this.props.onChange()
      this.lastKeyEventTimestamp = e.timeStamp;
    }
  }

  _onInputCode(character, index) {
    const { codeLength, onFulfill, compareWithCode, ignoreCase, onChange } = this.props;
    let newCodeArr = _.clone(this.state.codeArr);
    newCodeArr[index] = character;

    if (index == codeLength - 1) {
      const code = newCodeArr.join('');

      if (compareWithCode) {
        const isMatching = this._isMatchingCode(code, compareWithCode, ignoreCase);
        character !== '' && onFulfill(isMatching, code);
        !isMatching && this.clear();
      } else {
        character !== '' && onFulfill(code);
      }
    } else {
      this._setFocus(this.state.currentIndex + 1);
    }

    this.setState(prevState => {
      return {
        codeArr: newCodeArr,
        currentIndex: index == codeLength - 1 ? prevState.currentIndex : prevState.currentIndex + 1
      };
    });
  }

  render() {
    const {
      codeLength,
      codeInputStyle,
      containerStyle,
      inputPosition,
      autoFocus,
      className,
      size,
      activeColor,
      showDivider,
      leftText,
      rightText,
    } = this.props;

    const initialCodeInputStyle = {
      width: size,
      height: size
    };

    let codeInputs = [];
    for (let i = 0; i < codeLength; i++) {
      const id = i;
      if (showDivider && i === 2) {
        codeInputs.push(
          <Text key={'asd'} style={{ fontSize: 30, height: 45, marginRight: 10 }}>/</Text>
        )
      }
      codeInputs.push(
        <View key={id}>
          {i === 0 && showDivider && <Text style={{ position: 'absolute', top: -20 }}>{leftText}</Text>}
          {i === 2 && showDivider && <Text style={{ position: 'absolute', top: -20 }}>{rightText}</Text>}
        <TextInput
          ref={ref => (this.codeInputRefs[id] = ref)}
          style={[
            styles.codeInput,
            initialCodeInputStyle,
            this._getClassStyle(className, this.state.currentIndex == id, id),
            codeInputStyle
          ]}
          underlineColorAndroid="transparent"
          selectionColor={activeColor}
          keyboardType={'name-phone-pad'}
          {...this.props}
          autoFocus={autoFocus && id == 0}
          onFocus={() => this._onFocus(id)}
          value={this.state.codeArr[id] ? this.state.codeArr[id].toString() : ''}
          onChangeText={text => this._onInputCode(text, id)}
          onKeyPress={(e) => this._onKeyPress(e, id)}
          maxLength={1}
          blurOnSubmit={false}
        />
          </View>
      )
    }

    return (
      <View style={[styles.container, this._getContainerStyle(size, inputPosition), containerStyle]}>
        {codeInputs}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 20
  },
  codeInput: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    padding: 0
  }
});
