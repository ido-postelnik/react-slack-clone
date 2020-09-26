import React, {Component} from 'react';
import { Progress } from "semantic-ui-react";

class ProgressBar extends Component {
  render() {
    const { uploadState, precentUploaded } = this.props;

    return (
      uploadState === 'uploading' && (
        <Progress
          className='progress__bar'
          percent={precentUploaded}
          progress
          indicating
          size='medium'
          inverted
        />
      )
    );
  }
} 

export default ProgressBar;