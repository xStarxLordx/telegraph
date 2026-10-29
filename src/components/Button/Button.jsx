import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Spinner from '../Spinner/Spinner';
import styles from './Button.module.css';
import ButtonVariant from './buttonVariant';

const variantPropType = PropTypes.oneOf(Object.values(ButtonVariant));

function classNames({ variant, block, size }) {
  return [styles.button, styles[variant], block && styles.block, size === 'large' && styles.large]
    .filter(Boolean)
    .join(' ');
}

/**
 * Primary / secondary / ghost button. While `pending` it shows a spinner and ignores clicks
 * (it stays focusable and announces the busy state).
 */
function Button({
  children,
  variant = ButtonVariant.PRIMARY,
  type = 'button',
  onClick = undefined,
  disabled = false,
  pending = false,
  block = false,
  size = 'normal',
  ariaLabel = undefined,
}) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- the prop is restricted by propTypes.
      type={type}
      className={classNames({ variant, block, size })}
      onClick={pending ? undefined : onClick}
      disabled={disabled}
      aria-busy={pending || undefined}
      aria-label={ariaLabel}
    >
      {pending && <Spinner inline />}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: variantPropType,
  type: PropTypes.oneOf(['button', 'submit']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  pending: PropTypes.bool,
  block: PropTypes.bool,
  size: PropTypes.oneOf(['normal', 'large']),
  ariaLabel: PropTypes.string,
};

/** A router link that looks like a Button (e.g. the "Tweet" call to action). */
export function LinkButton({
  children,
  to,
  variant = ButtonVariant.PRIMARY,
  block = false,
  size = 'normal',
}) {
  return (
    <Link to={to} className={classNames({ variant, block, size })}>
      {children}
    </Link>
  );
}

LinkButton.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
  variant: variantPropType,
  block: PropTypes.bool,
  size: PropTypes.oneOf(['normal', 'large']),
};

export default Button;
