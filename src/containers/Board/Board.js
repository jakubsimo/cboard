import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import classNames from 'classnames';
import CheckCircleIcon from 'material-ui-icons/CheckCircle';

import {
  changeBoard,
  previousBoard,
  addBoard,
  addSymbol,
  deleteSymbols,
  editSymbols
} from './actions';
import { showNotification } from '../Notifications/actions';
import speech from '../../speech';
import SymbolDetails from './SymbolDetails';
import Settings from '../Settings';
import Grid from '../Grid';
import Output from './Output';
import Navbar from './Navbar';
import EditToolbar from './EditToolbar';

import './Board.css';

export class Board extends Component {
  constructor(props) {
    super(props);

    this.state = {
      output: [],
      selectedSymbols: [],
      isSelecting: false,
      isLocked: true,
      symbolDetailsOpen: false,
      settingsOpen: false
    };
  }

  speak = text => {
    if (!text) {
      return;
    }
    speech.speak(text);
  };

  cancelSpeak = () => {
    speech.cancel();
  };

  outputPush(value) {
    this.setState({ output: [...this.state.output, value] });
  }

  outputPop() {
    const [...output] = this.state.output;
    output.pop();
    this.setState({ output });
  }

  toggleSelectMode() {
    this.setState(prevState => ({
      isSelecting: !prevState.isSelecting,
      selectedSymbols: []
    }));
  }

  selectSymbol(symbolId) {
    this.setState({
      selectedSymbols: [...this.state.selectedSymbols, symbolId]
    });
  }

  deselectSymbol(symbolId) {
    const [...selectedSymbols] = this.state.selectedSymbols;
    const symbolIndex = selectedSymbols.indexOf(symbolId);
    selectedSymbols.splice(symbolIndex, 1);
    this.setState({ selectedSymbols });
  }

  toggleSymbolSelect(symbol) {
    const symbolId = symbol.id;

    if (symbol.isSelected) {
      this.deselectSymbol(symbolId);
    } else {
      this.selectSymbol(symbolId);
    }
  }

  handleSymbolClick = symbol => {
    const { changeBoard } = this.props;

    if (this.state.isSelecting) {
      this.toggleSymbolSelect(symbol);
      return;
    }

    switch (symbol.type) {
      case 'folder':
        this.boardSymbols.scrollTop = 0;
        changeBoard(symbol.boardId);
        break;
      default:
        const { intl } = this.props;
        this.outputPush(symbol);
        this.speak(intl.formatMessage({ id: symbol.text || symbol.label }));
    }
  };

  handleOutputClick = symbol => {
    const { intl } = this.props;
    const translatedOutput = this.state.output.reduce(
      (output, value) => output + intl.formatMessage({ id: value.label }) + ' ',
      ''
    );
    this.cancelSpeak();
    this.speak(translatedOutput);
  };

  handleOutputClearClick = () => {
    this.setState({ output: [] });
    this.cancelSpeak();
  };

  handleOutputBackspaceClick = () => {
    this.outputPop();
    this.cancelSpeak();
  };

  handleSettingsClick = () => {
    this.setState({ settingsOpen: true });
  };

  handleSettingsCancel = () => {
    this.setState({ settingsOpen: false });
  };

  handleBackClick = () => {
    const { previousBoard } = this.props;
    previousBoard();
  };

  handleSelectClick = () => {
    this.toggleSelectMode();
  };

  handleAddClick = () => {
    this.setState({
      symbolDetailsOpen: true,
      selectedSymbols: [],
      isSelecting: false
    });
  };

  handleEditClick = () => {
    this.setState({ symbolDetailsOpen: true });
  };

  handleDeleteClick = () => {
    const { deleteSymbols, board } = this.props;
    this.setState({ selectedSymbols: [] });
    deleteSymbols(this.state.selectedSymbols, board.id);
  };

  handleSymbolDetailsCancel = () => {
    this.setState({ symbolDetailsOpen: false });
  };

  handleEditSymbolDetailsSubmit = symbols => {
    const { board, editSymbols } = this.props;
    editSymbols(symbols, board.id);
    this.toggleSelectMode();
  };

  handleAddSymbolDetailsSubmit = symbol => {
    const { addSymbol, addBoard, board } = this.props;
    if (symbol.type === 'folder') {
      addBoard(symbol.label);
    }
    addSymbol(symbol, board.id);
  };

  handleLockClick = () => {
    this.setState((state, props) => ({
      isLocked: !state.isLocked,
      isSelecting: false,
      selectedSymbols: []
    }));
  };

  generateSymbols(symbols, boardId) {
    return Object.keys(symbols).map((id, index) => {
      const symbol = symbols[id];
      symbol.key = `${boardId}.${id}`;
      symbol.isSelected = this.state.selectedSymbols.includes(symbol.id);

      const { type, label, img, key, isSelected } = symbol;

      const symbolClasses = classNames({
        Symbol: true,
        'Symbol--folder': type === 'folder',
        'is-selected': isSelected
      });

      return (
        <button
          key={key}
          className={symbolClasses}
          onClick={() => {
            this.handleSymbolClick(symbol);
          }}
        >
          {img && (
            <div className="Symbol__container">
              <img className="Symbol__image" src={img} alt="" />
            </div>
          )}
          <div className="Symbol__label">
            <FormattedMessage id={label} />
          </div>
          {isSelected && <CheckCircleIcon className="CheckCircleIcon" />}
        </button>
      );
    });
  }

  render() {
    const { board, navHistory, dir } = this.props;
    const symbols = this.generateSymbols(board.symbols, board.id);

    return (
      <div
        className={classNames(
          {
            'is-selecting': this.state.isSelecting,
            'is-locked': this.state.isLocked
          },
          'Board'
        )}
      >
        <Output
          className="Board__output"
          values={this.state.output}
          onClick={this.handleOutputClick}
          onClearClick={this.handleOutputClearClick}
          onBackspaceClick={this.handleOutputBackspaceClick}
          dir={dir}
        />

        <Navbar
          className="Board__navbar"
          title={board.id}
          navHistory={navHistory}
          onBackClick={this.handleBackClick}
          onLockClick={this.handleLockClick}
        />

        <EditToolbar
          className="Board__edit-toolbar"
          isItemsSelected={!!this.state.selectedSymbols.length}
          onSelectClick={this.handleSelectClick}
          onAddClick={this.handleAddClick}
          onEditClick={this.handleEditClick}
          onDeleteClick={this.handleDeleteClick}
          onSettingsClick={this.handleSettingsClick}
        />
        <div
          className="Board__symbols"
          ref={ref => {
            this.boardSymbols = ref;
          }}
        >
          <Grid id={board.id} edit={this.state.isSelecting}>
            {symbols}
          </Grid>
        </div>

        <SymbolDetails
          editingSymbols={this.state.selectedSymbols.map(s => board.symbols[s])}
          open={this.state.symbolDetailsOpen}
          onCancel={this.handleSymbolDetailsCancel}
          onEditSubmit={this.handleEditSymbolDetailsSubmit}
          onAddSubmit={this.handleAddSymbolDetailsSubmit}
        />
        <Settings
          open={this.state.settingsOpen}
          onCancel={this.handleSettingsCancel}
        />
      </div>
    );
  }
}

Board.propTypes = {
  className: PropTypes.string,
  intl: intlShape.isRequired,
  board: PropTypes.shape({
    id: PropTypes.string,
    symbols: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        type: PropTypes.string,
        label: PropTypes.string,
        text: PropTypes.string,
        img: PropTypes.string
      })
    )
  }),
  navHistory: PropTypes.arrayOf(PropTypes.string)
};

Board.defaultProps = {
  className: ''
};

const mapStateToProps = state => {
  const {
    board: { boards, activeBoardId, navHistory },
    language: { dir }
  } = state;
  const board = boards.find(board => board.id === activeBoardId);

  return {
    board,
    navHistory,
    dir,
    speech
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeBoard: boardId => dispatch(changeBoard(boardId)),
    previousBoard: () => dispatch(previousBoard()),
    addBoard: boardId => dispatch(addBoard(boardId)),
    addSymbol: (symbol, boardId) => {
      dispatch(addSymbol(symbol, boardId));
      dispatch(showNotification('Symbol added'));
    },
    deleteSymbols: (symbols, boardId) => {
      dispatch(deleteSymbols(symbols, boardId));
      dispatch(showNotification('Symbol deleted'));
    },
    editSymbols: (symbols, boardId) => dispatch(editSymbols(symbols, boardId))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(Board));
