import Vue from 'vue';
import VueApollo from 'vue-apollo';
import createMockApollo from 'helpers/mock_apollo_helper';
import waitForPromises from 'helpers/wait_for_promises';
import { createMockDirective, getBinding } from 'helpers/vue_mock_directive';
import { shallowMountExtended } from 'helpers/vue_test_utils_helper';
import runnerRunningJobQuery from '~/ci/runner/graphql/list/runner_running_job.query.graphql';

import RunnerRunningJobBadge from '~/ci/runner/components/runner_running_job_badge.vue';
import RunnerJobStatusBadge from '~/ci/runner/components/runner_job_status_badge.vue';

Vue.use(VueApollo);

const mockRunnerId = 'gid://gitlab/Ci::Runner/99';

const mockRunningJobData = {
  data: {
    runner: {
      id: mockRunnerId,
      jobs: {
        nodes: [
          {
            id: 'gid://gitlab/Ci::Build/1234',
            name: 'test-job',
            webPath: '/group/project/-/jobs/1234',
          },
        ],
      },
    },
  },
};

describe('RunnerRunningJobBadge', () => {
  let wrapper;
  let runnerRunningJobHandler;

  const findBadge = () => wrapper.findComponent(RunnerJobStatusBadge);

  const createComponent = ({ jobExecutionStatus = 'ACTIVE' } = {}) => {
    wrapper = shallowMountExtended(RunnerRunningJobBadge, {
      apolloProvider: createMockApollo([[runnerRunningJobQuery, runnerRunningJobHandler]]),
      propsData: {
        runner: { id: mockRunnerId, jobExecutionStatus },
      },
      directives: {
        GlTooltip: createMockDirective('gl-tooltip'),
      },
    });
  };

  beforeEach(() => {
    runnerRunningJobHandler = jest.fn().mockResolvedValue(mockRunningJobData);
  });

  describe('when the runner is idle', () => {
    beforeEach(async () => {
      createComponent({ jobExecutionStatus: 'IDLE' });
      await waitForPromises();
    });

    it('does not fetch the running job', () => {
      expect(runnerRunningJobHandler).not.toHaveBeenCalled();
    });

    it('displays the job status badge without a link', () => {
      expect(findBadge().props('jobStatus')).toBe('IDLE');
      expect(findBadge().attributes('href')).toBeUndefined();
    });
  });

  describe('when the runner is active', () => {
    it('displays the badge without a link while loading', () => {
      runnerRunningJobHandler.mockReturnValue(new Promise(() => {}));
      createComponent();

      expect(runnerRunningJobHandler).toHaveBeenCalledWith({ id: mockRunnerId });
      expect(findBadge().props('jobStatus')).toBe('ACTIVE');
      expect(findBadge().attributes('href')).toBeUndefined();
    });

    it('links the badge to the running job', async () => {
      createComponent();
      await waitForPromises();

      expect(findBadge().props('jobStatus')).toBe('ACTIVE');
      expect(findBadge().attributes('href')).toBe('/group/project/-/jobs/1234');
      expect(findBadge().attributes('title')).toBe('Running job #1234: test-job');
      expect(getBinding(findBadge().element, 'gl-tooltip')).toBeDefined();
    });

    it('displays the badge without a link when no running job is visible', async () => {
      runnerRunningJobHandler.mockResolvedValue({
        data: { runner: { id: mockRunnerId, jobs: { nodes: [] } } },
      });
      createComponent();
      await waitForPromises();

      expect(findBadge().props('jobStatus')).toBe('ACTIVE');
      expect(findBadge().attributes('href')).toBeUndefined();
    });

    it('displays the badge without a link when the request fails', async () => {
      runnerRunningJobHandler.mockRejectedValue(new Error('Error!'));
      createComponent();
      await waitForPromises();

      expect(findBadge().props('jobStatus')).toBe('ACTIVE');
      expect(findBadge().attributes('href')).toBeUndefined();
    });
  });
});
