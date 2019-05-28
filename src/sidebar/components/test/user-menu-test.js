'use strict';

const { createElement } = require('preact');
const { shallow } = require('enzyme');

const UserMenu = require('../user-menu');
const MenuItem = require('../menu-item');

describe('UserMenu', () => {
  let fakeAuth,
    fakeBridge,
    fakeInSidebar,
    fakeIsThirdPartyUser,
    fakeOnLogout,
    fakeProfileBridgeEvent,
    fakeServiceConfig,
    fakeServiceUrl,
    fakeSettings;

  const createUserMenu = () => {
    return shallow(
      <UserMenu
        auth={fakeAuth}
        bridge={fakeBridge}
        inSidebar={fakeInSidebar}
        onLogout={fakeOnLogout}
        serviceUrl={fakeServiceUrl}
        settings={fakeSettings}
      />
    ).dive(); // Dive needed because this component uses `withServices`
  };

  const findMenuItem = (wrapper, labelText) => {
    return wrapper
      .find(MenuItem)
      .filterWhere(n => n.prop('label') === labelText);
  };

  beforeEach(() => {
    fakeAuth = {
      displayName: 'Eleanor Fishtail',
      status: 'logged-in',
      userid: 'acct:eleanorFishtail@hypothes.is',
      username: 'eleanorFishy',
    };
    fakeBridge = { call: sinon.stub() };
    fakeInSidebar = true;
    fakeIsThirdPartyUser = sinon.stub();
    fakeOnLogout = sinon.stub();
    fakeProfileBridgeEvent = 'profile-requested';
    fakeServiceConfig = sinon.stub();
    fakeServiceUrl = sinon.stub();
    fakeSettings = {
      authDomain: 'hypothes.is',
    };

    UserMenu.$imports.$mock({
      '../util/account-id': {
        isThirdPartyUser: fakeIsThirdPartyUser,
      },
      '../service-config': fakeServiceConfig,
      '../../shared/bridge-events': {
        PROFILE_REQUESTED: fakeProfileBridgeEvent,
      },
    });
  });

  afterEach(() => {
    UserMenu.$imports.$restore();
  });

  describe('profile menu item', () => {
    beforeEach(() => {
      fakeServiceUrl.returns('profile-link');
    });

    context('in sidebar', () => {
      it('should be selectable if no service configured', () => {
        fakeServiceConfig.returns(null);

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
        assert.equal(profileMenuItem.prop('href'), 'profile-link');
        assert.calledWith(fakeServiceUrl, 'user', { user: fakeAuth.username });
      });

      it('should be selectable if service supports `onProfileRequest`', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: true });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
        assert.equal(profileMenuItem.prop('href'), 'profile-link');
      });

      it('should be disabled if service does not support `onProfileRequest`', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: false });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isUndefined(profileMenuItem.prop('onClick'));
        assert.isUndefined(profileMenuItem.prop('href'));
        assert.isTrue(profileMenuItem.prop('isDisabled'));
      });
    });

    context('not in sidebar', () => {
      beforeEach(() => {
        fakeInSidebar = false;
      });

      it('should be selectable if no service configured', () => {
        fakeServiceConfig.returns(null);

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
      });

      it('should be selectable if service supports `onProfileRequest`', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: true });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
      });

      it('should be selectable if service does not support `onProfileRequest`', () => {
        fakeServiceConfig.returns({ onProfileRequestProvided: false });

        const wrapper = createUserMenu();

        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        assert.isFunction(profileMenuItem.prop('onClick'));
      });
    });

    describe('profile-selected callback', () => {
      it('should fire profile event when in sidebar for third-party user', () => {
        UserMenu.$imports.$mock({
          '../util/account-id': {
            isThirdPartyUser: sinon.stub().returns(true),
          },
        });
        const wrapper = createUserMenu();
        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        const onProfileSelected = profileMenuItem.prop('onClick');

        onProfileSelected();

        assert.equal(fakeBridge.call.callCount, 1);
        assert.calledWith(fakeBridge.call, fakeProfileBridgeEvent);
      });

      it('should not fire profile event for first-party user', () => {
        fakeIsThirdPartyUser.returns(false);
        const wrapper = createUserMenu();
        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        const onProfileSelected = profileMenuItem.prop('onClick');

        onProfileSelected();

        assert.equal(fakeBridge.call.callCount, 0);
      });

      it('should not fire profile event when not in sidebar for third-party user', () => {
        fakeInSidebar = false;
        fakeIsThirdPartyUser.returns(true);
        const wrapper = createUserMenu();
        const profileMenuItem = findMenuItem(wrapper, fakeAuth.displayName);
        const onProfileSelected = profileMenuItem.prop('onClick');

        onProfileSelected();

        assert.equal(fakeBridge.call.callCount, 0);
      });
    });
  });

  describe('account settings menu item', () => {
    it('should be present if first-party user', () => {
      fakeIsThirdPartyUser.returns(false);

      const wrapper = createUserMenu();

      const accountMenuItem = findMenuItem(wrapper, 'Account settings');
      assert.isTrue(accountMenuItem.exists());
      assert.calledWith(fakeServiceUrl, 'account.settings');
    });

    it('should not be present if third-party user', () => {
      fakeIsThirdPartyUser.returns(true);

      const wrapper = createUserMenu();

      const accountMenuItem = findMenuItem(wrapper, 'Account settings');
      assert.isFalse(accountMenuItem.exists());
    });
  });

  describe('log out menu item', () => {
    describe('logout menu item presence', () => {
      const tests = [
        {
          it: 'should be present if no service configured, in sidebar',
          inSidebar: true,
          serviceConfigReturns: null,
          expected: true,
        },
        {
          it:
            'should be present if service supports `onLogoutRequest`, in sidebar',
          inSidebar: true,
          serviceConfigReturns: { onLogoutRequestProvided: true },
          expected: true,
        },
        {
          it:
            'should not be present if service does not support `onLogoutRequest`, in sidebar',
          inSidebar: true,
          serviceConfigReturns: { onLogoutRequestProvided: false },
          expected: false,
        },
        {
          it: 'should be present if no service configured, not in sidebar',
          inSidebar: false,
          serviceConfigReturns: null,
          expected: true,
        },
        {
          it:
            'should be present if service supports `onLogoutRequest`, not in sidebar',
          inSidebar: false,
          serviceConfigReturns: { onProfileRequestProvided: true },
          expected: true,
        },
        {
          it:
            'should be present if service does not support `onLogoutRequest`, not in sidebar',
          inSidebar: false,
          serviceConfigReturns: { onProfileRequestProvided: false },
          expected: true,
        },
      ];

      tests.forEach(test => {
        it(test.it, () => {
          fakeInSidebar = test.inSidebar;
          fakeServiceConfig.returns(test.serviceConfigReturns);

          const wrapper = createUserMenu();

          const logOutMenuItem = findMenuItem(wrapper, 'Log out');
          assert.equal(logOutMenuItem.exists(), test.expected, test.it);
          if (test.expected) {
            assert.equal(logOutMenuItem.prop('onClick'), fakeOnLogout);
          }
        });
      });
    });
  });
});
