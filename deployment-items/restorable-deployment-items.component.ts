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
import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FactoryManagerSettingsService } from '@fman/misc/services/factory-manager-settings.service';
import { ApiService } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { deployment_items_translations_de_DE } from './locale/deployment-items-translations.de-DE';
import { deployment_items_translations_en_US } from './locale/deployment-items-translations.en-US';
import { XoDeploymentItem } from './xo/xo-deployment-item.model';


export interface DeploymentItemsInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    Deploy: string;
    Undeploy: string;
    ForceDeploy: string;
}


export const DEPLOYMENT_ITEMS_ISWP: DeploymentItemsInputScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.deploymentitems.GetDeploymentItems',
    Details: 'xmcp.factorymanager.deploymentitems.GetDeploymentItem',
    Add: '',
    Save: '',
    Delete: 'xmcp.factorymanager.deploymentitems.DeleteDeploymentItem',
    Deploy: 'xmcp.factorymanager.deploymentitems.DeployDeploymentItem',
    Undeploy: 'xmcp.factorymanager.deploymentitems.UndeployDeploymentItem',
    ForceDeploy: 'xmcp.factorymanager.deploymentitems.ForceDeployDeploymentItem'
};


export enum DeployResolution {
    SKIP = 'fman.restorable-deployment-items.skip',
    FORCE_UNDEPLOY = 'fman.restorable-deployment-items.force-undeploy',
    FORCE_RECURSIVE_UNDEPLOY = 'fman.restorable-deployment-items.force-recursive-undeploy'
}


export enum DeleteDeploymentItemResolution {
    SKIP = 'fman.restorable-deployment-items.skip',
    // FORCE_DELETE = 'Force delete',
    FORCE_DELETE_AND_RECURSIVE_UNDEPLOY = 'fman.restorable-deployment-items.force-delete-and-recursive-undeploy',
    FORCE_RECURSIVE_DELETE = 'fman.restorable-deployment-items.force-recursive-delete'
}


@Component({
    selector: 'restorable-deployment-items',
    template: ''
})
export class RestorableDeploymentItemsComponent extends RestorableRouteComponent<XoDeploymentItem> implements OnInit {

    protected UNSPECIFIED_DETAILS_ERROR = 'fman.restorable-deployment-items.unspecified-details-error';
    protected CONFIRM_DELETE = 'fman.restorable-deployment-items.confirm-delete';
    protected UNSPECIFIED_DEPLOY_ERROR = 'fman.restorable-deployment-items.unspecified-deploy-error';
    protected UNSPECIFIED_UNDEPLOY_ERROR = 'fman.restorable-deployment-items.unspecified-undeploy-error';
    protected UNSPECIFIED_DELETE_ERROR = 'fman.restorable-deployment-items.unspecified-delete-error';

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        injector: Injector,
        settings: FactoryManagerSettingsService
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);

        this.i18nService.setTranslations(LocaleService.DE_DE, deployment_items_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, deployment_items_translations_en_US);
    }

    private translateConstants() {
        this.UNSPECIFIED_DETAILS_ERROR = this.i18nService.translate(this.UNSPECIFIED_DETAILS_ERROR);
        this.UNSPECIFIED_DEPLOY_ERROR = this.i18nService.translate(this.UNSPECIFIED_DEPLOY_ERROR);
        this.UNSPECIFIED_UNDEPLOY_ERROR = this.i18nService.translate(this.UNSPECIFIED_UNDEPLOY_ERROR);
        this.CONFIRM_DELETE = this.i18nService.translate(this.CONFIRM_DELETE);
        this.UNSPECIFIED_DELETE_ERROR = this.i18nService.translate(this.UNSPECIFIED_DELETE_ERROR);

        Object.keys(DeployResolution).forEach(key => DeployResolution[key] = this.i18nService.translate(DeployResolution[key]));
        Object.keys(DeleteDeploymentItemResolution).forEach(key => DeleteDeploymentItemResolution[key] = this.i18nService.translate(DeleteDeploymentItemResolution[key]));
    }

    ngOnInit() {
        super.ngOnInit();
        this.translateConstants();
    }

}
