'use strict';

const { createElement } = require('preact');
const propTypes = require('prop-types');

const { isThirdPartyUser } = require('../util/account-id');
const bridgeEvents = require('../../shared/bridge-events');
const serviceConfig = require('../service-config');
const { withServices } = require('../util/service-context');

const Menu = require('./menu');
const MenuSection = require('./menu-section');
const MenuItem = require('./menu-item');

function UserMenu({ auth, bridge, inSidebar, onLogout, serviceUrl, settings }) {
  const isThirdParty = isThirdPartyUser(auth.userid, settings.authDomain);
  const service = serviceConfig(settings);

  const serviceSupports = feature => !service || !!service[feature];

  const isSelectableProfile = () =>
    serviceSupports('onProfileRequestProvided') || !inSidebar;
  const logoutEnabled = () =>
    serviceSupports('onLogoutRequestProvided') || !inSidebar;

  const onProfileSelected = () =>
    isThirdParty && inSidebar && bridge.call(bridgeEvents.PROFILE_REQUESTED);

  const menuLabel = <i className="h-icon-account top-bar__btn" />;
  return (
    <div className="user-menu">
      <Menu label={menuLabel} title={auth.displayName} align="right">
        <MenuSection>
          {isSelectableProfile() ? (
            <MenuItem
              label={auth.displayName}
              onClick={onProfileSelected}
              href={serviceUrl('user', { user: auth.username })}
            />
          ) : (
            <MenuItem label={auth.displayName} isDisabled={true} />
          )}
          {!isThirdParty && (
            <MenuItem
              label="Account settings"
              href={serviceUrl('account.settings')}
            />
          )}
        </MenuSection>
        {logoutEnabled() && (
          <MenuSection>
            <MenuItem label="Log out" onClick={onLogout} />
          </MenuSection>
        )}
      </Menu>
    </div>
  );
}

UserMenu.propTypes = {
  auth: propTypes.object.isRequired,
  bridge: propTypes.object.isRequired,
  inSidebar: propTypes.bool,
  onLogout: propTypes.func.isRequired,
  serviceUrl: propTypes.func.isRequired,
  settings: propTypes.object.isRequired,
};

UserMenu.injectedProps = ['bridge', 'serviceUrl', 'settings'];

module.exports = withServices(UserMenu);
