// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { isString } from '@zeta/base';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';

import { DeploymentItemAttentionTemplateComponent, DeploymentItemAttentionTemplateData } from '../templates/deployment-item-attention-template.component';
import { XoDependencyArray } from './xo-dependency.model';
import { XoDeploymentItemId } from './xo-deployment-item-id.model';
import { XoDeploymentMarkerTagArray } from './xo-deployment-marker-tag.model';
import { XoExceptionInformation } from './xo-exception-information.model';
import { XoInconsistencyArray } from './xo-inconsistency.model';
import { XoResolutionFailureArray } from './xo-resolution-failure.model';


@XoObjectClass(null, 'xmcp.factorymanager.deploymentitems', 'DeploymentItem')
export class XoDeploymentItem extends XoObject {

    @XoProperty(XoDeploymentItemId)
    id = new XoDeploymentItemId();

    @XoProperty()
    @XoUnique()
    label: string;

    @XoProperty()
    typeNiceName: string;

    @XoProperty()
    specialType: string;

    @XoProperty()
    lastModified: number;

    @XoProperty()
    lastModifiedBy: string;

    @XoProperty()
    lastStateChange: number;

    @XoProperty()
    lastStateChangeBy: string;

    @XoProperty()
    buildExceptionOccurred: boolean;

    @XoProperty()
    state: string;

    @XoProperty()
    openTaskCount: number;

    @XoProperty(XoDeploymentMarkerTagArray)
    tags = new XoDeploymentMarkerTagArray();

    @XoProperty()
    tagsNiceList: string;

    @XoProperty()
    lockedBy: string;

    @XoProperty()
    rollbackOccurred: boolean;

    @XoProperty(XoExceptionInformation)
    rollbackCause = new XoExceptionInformation();

    @XoProperty(XoExceptionInformation)
    rollbackException = new XoExceptionInformation();

    @XoProperty(XoExceptionInformation)
    buildException = new XoExceptionInformation();

    @XoProperty(XoInconsistencyArray)
    inconsitencies = new XoInconsistencyArray();

    @XoProperty(XoResolutionFailureArray)
    unresolvable = new XoResolutionFailureArray();

    @XoProperty(XoDependencyArray)
    dependencies = new XoDependencyArray();

    @XoProperty()
    @XoTransient()
    deploymentItemAttentionNameTemplate: XcTemplate[];


    afterDecode() {
        super.afterDecode();

        // numbers (long) could be sent as string, so convert back into number
        if (isString(this.lastModified)) {
            this.lastModified = parseInt(this.lastModified, 10);
        }
        if (isString(this.lastStateChange)) {
            this.lastStateChange = parseInt(this.lastStateChange, 10);
        }

        const data: DeploymentItemAttentionTemplateData = {
            value: this.id.name,
            attention: this.rollbackOccurred
            // attention: true
        };
        this.deploymentItemAttentionNameTemplate = [
            new XcComponentTemplate(DeploymentItemAttentionTemplateComponent, data)
        ];
    }

}

@XoArrayClass(XoDeploymentItem)
export class XoDeploymentItemArray extends XoArray<XoDeploymentItem> {
}
