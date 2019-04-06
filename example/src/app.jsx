import LCUI from 'lcui'
import {
  Widget,
  Button,
  TextView,
  TextEdit
} from 'lcui/widget'
import Progress from './components/progress'

class MyApp extends LCUI.App {
  constructor() {
    super()
  
    // Define internal state data
    this.state = {
      text: String,
      input: String,
      value: Number,
      total: Number
    }
  }

  created() {
    // Initialize state
    this.state.text = 'Hello, World!'
    this.state.input = 'Hello, World!'
    this.state.value = 50
    this.state.total = 100
  }

  template() {
    return (<Widget>
      <TextView ref="test">{this.state.text}</TextView>
      <TextEdit test="asd" value={this.state.input} />
      <Button onClick={this.changeText}>Change</Button>
      <TextView>Please click button to test progress</TextView>
      <Progress value={this.state.value} total={this.state.total} />
      <Button onClick={this.onBtnMinusClick}>-</Button>
      <Button onClick={this.onBtnPlusClick}>>+</Button>
    </Widget>)
  }

  onBtnChangeClick() {
    this.state.text = this.state.input
  }

  onBtnMinusClick() {
    if (this.state.value > 0) {
      this.state.value -= 10
    }
  }

  onBtnPlusClick() {
    if (this.state.value < 100) {
      this.state.value += 10
    }
  }
}

export default MyApp
