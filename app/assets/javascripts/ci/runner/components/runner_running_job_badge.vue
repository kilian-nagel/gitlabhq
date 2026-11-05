<script>
import { GlLink, GlTooltipDirective } from '@gitlab/ui';
import { getIdFromGraphQLId } from '~/graphql_shared/utils';
import { s__, sprintf } from '~/locale';
import runnerRunningJobQuery from '../graphql/list/runner_running_job.query.graphql';
import { JOB_STATUS_ACTIVE } from '../constants';
import RunnerJobStatusBadge from './runner_job_status_badge.vue';

export default {
  name: 'RunnerRunningJobBadge',
  components: {
    GlLink,
    RunnerJobStatusBadge,
  },
  directives: {
    GlTooltip: GlTooltipDirective,
  },
  props: {
    runner: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      runningJob: null,
    };
  },
  apollo: {
    runningJob: {
      query: runnerRunningJobQuery,
      // No batchKey: `jobs` can only be resolved for one runner per request,
      // and batched queries would share that limit.
      skip() {
        return this.runner.jobExecutionStatus !== JOB_STATUS_ACTIVE;
      },
      variables() {
        return { id: this.runner.id };
      },
      update(data) {
        return data?.runner?.jobs?.nodes?.[0] || null;
      },
      error() {
        // The user may not have access to the job, show the badge without a link
        this.runningJob = null;
      },
    },
  },
  computed: {
    runningJobText() {
      return sprintf(s__('Runners|Running job #%{jobId}: %{jobName}'), {
        jobId: getIdFromGraphQLId(this.runningJob.id),
        jobName: this.runningJob.name,
      });
    },
  },
};
</script>
<template>
  <div class="gl-contents">
    <runner-job-status-badge :job-status="runner.jobExecutionStatus" />
    <gl-link
      v-if="runningJob && runningJob.webPath"
      v-gl-tooltip
      :href="runningJob.webPath"
      :title="runningJobText"
      class="gl-basis-full gl-truncate gl-text-sm"
      data-testid="runner-running-job-link"
    >
      {{ runningJobText }}
    </gl-link>
  </div>
</template>
