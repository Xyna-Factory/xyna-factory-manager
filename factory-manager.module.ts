/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ZetaModule } from '@zeta/zeta.module';

import { AdministrativeVetoesComponent } from './administrative-vetoes/administrative-vetoes.component';
import { AddNewAdministrativeVetoModalComponent } from './administrative-vetoes/modal/add-new-administrative-veto-modal/add-new-administrative-veto-modal.component';
import { CapacitiesComponent } from './capacities/capacities.component';
import { AddNewCapacityModalComponent } from './capacities/modal/add-new-capacity-modal/add-new-capacity-modal.component';
import { CapacityTableInuseTemplateComponent } from './capacities/templates/capacity-table-inuse-template.model';
import { CapacityUsageTemplateComponent } from './capacities/templates/capacity-usage-template.component';
import { ExecutionTimeComponent } from './cronlike-orders/components/execution-time/execution-time.component';
import { CronlikeOrdersComponent } from './cronlike-orders/cronlike-orders.component';
import { AddNewCronlikeOrderModalComponent } from './cronlike-orders/modal/add-new-cronlike-order-modal/add-new-cronlike-order-modal.component';
import { CronlikeOrderIntervalTemplateComponent } from './cronlike-orders/templates/cronlike-order-interval-template.component';
import { DeploymentStateDetailComponent } from './deployment-items/components/deployment-state-detail/deployment-state-detail.component';
import { DeploymentItemsComponent } from './deployment-items/deployment-items.component';
import { DeleteReportItemComponent } from './deployment-items/modal/delete-report/delete-report-item/delete-report-item.component';
import { DeleteReportComponent } from './deployment-items/modal/delete-report/delete-report.component';
import { DeployModalComponent } from './deployment-items/modal/deploy-modal/deploy-modal.component';
import { SelectRuntimeContextComponent } from './deployment-items/modal/select-runtime-context/select-runtime-context.component';
import { UndeployReportItemComponent } from './deployment-items/modal/undeploy-report/undeploy-report-item/undeploy-report-item.component';
import { UndeployReportComponent } from './deployment-items/modal/undeploy-report/undeploy-report.component';
import { DeploymentItemAttentionTemplateComponent } from './deployment-items/templates/deployment-item-attention-template.component';
import { FactoryManagerComponent } from './factory-manager.component';
import { DateSelectorComponent } from './misc/components/date-selector/date-selector.component';
import { InputParameterComponent } from './misc/components/input-parameter/input-parameter.component';
import { FMFocusCandidateDirective } from './misc/directives/fm-focus-candidate.directive';
import { FactoryManagerSettingsService } from './misc/services/factory-manager-settings.service';
import { GenerateInputComponent } from './order-input-sources/components/generate-input-component/generate-input.component';
import { AddNewOrderInputSourceModalComponent } from './order-input-sources/modal/add-new-order-input-source-modal/add-new-order-input-source-modal.component';
import { OrderInputSourceDetailsModalComponent } from './order-input-sources/modal/order-input-source-details-modal/order-input-source-details-modal.component';
import { OrderInputSourceDetailsComponent } from './order-input-sources/order-input-source-details/order-input-source-details.component';
import { OrderInputSourcesComponent } from './order-input-sources/order-input-sources.component';
import { ChildOrderInheritanceRuleComponent } from './order-types/items/child-order-inheritance-rule/child-order-inheritance-rule.component';
import { AddNewOrderTypeModalComponent } from './order-types/modal/add-new-order-type-modal/add-new-order-type-modal.component';
import { OrderTypesComponent } from './order-types/order-types.component';
import { PluginComponent } from './plugin/plugin.component';
import { PluginService } from './plugin/plugin.service';
import { CustomInformationFormComponent } from './reuseable-components/forms/custom-information-form/custom-information-form.component';
import { OrderTypeFormComponent } from './reuseable-components/forms/order-type-form/order-type-form.component';
import { ApplicationTileComponent } from './runtime-contexts/applications/application-tile/application-tile.component';
import { ApplicationsComponent } from './runtime-contexts/applications/applications.component';
import { ClearWorkspaceDialogComponent } from './runtime-contexts/dialog/clear-workspace/clear-workspace-dialog.component';
import { CreateApplicationDefinitionDialogComponent } from './runtime-contexts/dialog/create-application-definition/create-application-definition-dialog.component';
import { CreateRuntimeApplicationDialogComponent } from './runtime-contexts/dialog/create-runtime-application/create-runtime-application-dialog.component';
import { CreateWorkspaceDialogComponent } from './runtime-contexts/dialog/create-workspace/create-workspace-dialog.component';
import { DeleteDuplicatesDialogComponent } from './runtime-contexts/dialog/delete-duplicates/delete-duplicates-dialog.component';
import { DeleteRuntimeApplicationDialogComponent } from './runtime-contexts/dialog/delete-runtime-application/delete-runtime-application-dialog.component';
import { DeleteWorkspaceDialogComponent } from './runtime-contexts/dialog/delete-workspace/delete-workspace-dialog.component';
import { ExportApplicationDialogComponent } from './runtime-contexts/dialog/export-application/export-application-dialog.component';
import { ImportRuntimeApplicationDialogComponent } from './runtime-contexts/dialog/import-runtime-application/import-runtime-application-dialog.component';
import { LoadRuntimeApplicationDialogComponent } from './runtime-contexts/dialog/load-runtime-application/load-runtime-application-dialog.component';
import { ManageContentDialogComponent } from './runtime-contexts/dialog/manage-content/manage-content-dialog.component';
import { ManageDependenciesDialogComponent } from './runtime-contexts/dialog/manage-dependencies/manage-dependencies-dialog.component';
import { MigrateWizardComponent } from './runtime-contexts/dialog/migrate-wizard/migrate-wizard.component';
import { ShowWorkspaceContentDialogComponent } from './runtime-contexts/dialog/show-workspace-content/show-workspace-content-dialog.component';
import { ChangeTemplateComponent } from './runtime-contexts/shared/change-template.component';
import { RuntimeContextButtonComponent } from './runtime-contexts/shared/runtime-context-button.component';
import { RuntimeContextIconComponent } from './runtime-contexts/shared/runtime-context-icon.component';
import { RuntimeContextNameComponent } from './runtime-contexts/shared/runtime-context-name.component';
import { TileButtonComponent } from './runtime-contexts/shared/tile/tile-button/tile-button.component';
import { TileComponent } from './runtime-contexts/shared/tile/tile.component';
import { WorkspaceTileComponent } from './runtime-contexts/workspaces/workspace-tile/workspace-tile.component';
import { WorkspacesComponent } from './runtime-contexts/workspaces/workspaces.component';
import { StorableInstanceDetailComponent } from './storable-instances/components/storable-instance-detail/storable-instance-detail.component';
import { StorableInstanceCreationComponent } from './storable-instances/modal/storable-instance-creation/storable-instance-creation.component';
import { StorableInstancesComponent } from './storable-instances/storable-instances.component';
import { XoComplexStorableTemplateComponent } from './storable-instances/templates/xo-complex-storable-template/xo-complex-storable-template.component';
import { StorableInputParameterComponent } from './time-controlled-orders/components/storable-input-parameter/storable-input-parameter.component';
import { TcoDetailSectionComponent } from './time-controlled-orders/components/tco-detail-section/tco-detail-section.component';
import { TcoExecutionRestrictionComponent } from './time-controlled-orders/components/tco-execution-restriction/tco-execution-restriction.component';
import { CreateTimeControlledOrderComponent } from './time-controlled-orders/modal/create-time-controlled-order/create-time-controlled-order.component';
import { TimeControlledOrderTableEntryTemplateComponent } from './time-controlled-orders/template/time-controlled-order-table-entry-template/time-controlled-order-table-entry-template.component';
import { TimeControlledOrdersComponent } from './time-controlled-orders/time-controlled-orders.component';
import { DeployFilterDialogComponent } from './trigger-and-filter/components/deploy-filter-dialog/deploy-filter-dialog.component';
import { DeployTriggerDialogComponent } from './trigger-and-filter/components/deploy-trigger-dialog/deploy-trigger-dialog.component';
import { FilterDetailComponent } from './trigger-and-filter/components/filter-detail/filter-detail.component';
import { FilterInstanceDetailComponent } from './trigger-and-filter/components/filter-instance-detail/filter-instance-detail.component';
import { TriggerDetailComponent } from './trigger-and-filter/components/trigger-detail/trigger-detail.component';
import { TriggerInstanceDetailComponent } from './trigger-and-filter/components/trigger-instance-detail/trigger-instance-detail.component';
import { FilterComponent } from './trigger-and-filter/filter.component';
import { TriggerFilterStateIconComponent } from './trigger-and-filter/state-templates/trigger-filter-state-icon.component';
import { TriggerComponent } from './trigger-and-filter/trigger.component';
import { WorkflowTesterDialogComponent } from './workflow-tester/workflow-tester-dialog.component';
import { WorkflowTesterComponent } from './workflow-tester/workflow-tester.component';
import { AddNewXynaPropertyModalComponent } from './xyna-properties/modal/add-new-xyna-property-modal/add-new-xyna-property-modal.component';
import { XynaPropertyTableValueTemplateComponent } from './xyna-properties/templates/xyna-property-table-value-template.model';
import { XynaPropertiesComponent } from './xyna-properties/xyna-properties.component';
import { StartParameterDetailComponent } from './trigger-and-filter/components/start-parameter-deatil/start-parameter-detail.component';


@NgModule({
    imports: [
        ZetaModule,
        RouterModule,
        CommonModule,
        AddNewAdministrativeVetoModalComponent,
        AddNewCapacityModalComponent,
        AddNewCronlikeOrderModalComponent,
        AddNewOrderInputSourceModalComponent,
        AddNewOrderTypeModalComponent,
        AddNewXynaPropertyModalComponent,
        ApplicationsComponent,
        ApplicationTileComponent,
        AdministrativeVetoesComponent,
        CapacitiesComponent,
        CapacityTableInuseTemplateComponent,
        CapacityUsageTemplateComponent,
        CronlikeOrderIntervalTemplateComponent,
        ChangeTemplateComponent,
        ChildOrderInheritanceRuleComponent,
        ClearWorkspaceDialogComponent,
        CreateApplicationDefinitionDialogComponent,
        CreateRuntimeApplicationDialogComponent,
        CreateTimeControlledOrderComponent,
        CreateWorkspaceDialogComponent,
        CronlikeOrdersComponent,
        DateSelectorComponent,
        DeleteDuplicatesDialogComponent,
        DeleteReportComponent,
        DeleteReportItemComponent,
        DeleteRuntimeApplicationDialogComponent,
        DeleteWorkspaceDialogComponent,
        DeployModalComponent,
        DeploymentItemAttentionTemplateComponent,
        DeploymentItemsComponent,
        DeploymentStateDetailComponent,
        ExecutionTimeComponent,
        ExportApplicationDialogComponent,
        FMFocusCandidateDirective,
        FactoryManagerComponent,
        FilterComponent,
        FilterDetailComponent,
        FilterInstanceDetailComponent,
        DeployFilterDialogComponent,
        TriggerComponent,
        TriggerDetailComponent,
        TriggerInstanceDetailComponent,
        DeployTriggerDialogComponent,
        TriggerFilterStateIconComponent,
        GenerateInputComponent,
        ImportRuntimeApplicationDialogComponent,
        InputParameterComponent, // TODO - not used at the moment but a good idea
        LoadRuntimeApplicationDialogComponent,
        ManageContentDialogComponent,
        ManageDependenciesDialogComponent,
        MigrateWizardComponent,
        OrderInputSourceDetailsComponent,
        OrderInputSourceDetailsModalComponent,
        OrderInputSourcesComponent,
        OrderTypesComponent,
        PluginComponent,
        RuntimeContextButtonComponent,
        RuntimeContextIconComponent,
        RuntimeContextNameComponent,
        ShowWorkspaceContentDialogComponent,
        SelectRuntimeContextComponent,
        StartParameterDetailComponent,
        StorableInputParameterComponent,
        StorableInstancesComponent,
        StorableInstanceCreationComponent,
        StorableInstanceDetailComponent,
        XoComplexStorableTemplateComponent,
        TileComponent,
        TileButtonComponent,
        TimeControlledOrdersComponent,
        TcoDetailSectionComponent,
        TcoExecutionRestrictionComponent,
        TimeControlledOrderTableEntryTemplateComponent,
        UndeployReportComponent,
        UndeployReportItemComponent,
        WorkspacesComponent,
        WorkspaceTileComponent,
        XynaPropertiesComponent,
        XynaPropertyTableValueTemplateComponent,
        OrderTypeFormComponent,
        CustomInformationFormComponent,
        WorkflowTesterComponent,
        WorkflowTesterDialogComponent
    ],
    providers: [
        FactoryManagerSettingsService,
        PluginService
    ],
    exports: [
        ApplicationTileComponent,
        ImportRuntimeApplicationDialogComponent,
        InputParameterComponent,
        DeploymentStateDetailComponent
    ]
})
export class FactoryManagerModule { }
