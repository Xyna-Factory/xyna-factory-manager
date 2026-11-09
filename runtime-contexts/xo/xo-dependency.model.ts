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
import { XoArray, XoArrayClass, XoEnumerated, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { XcCheckboxTemplate, XcComponentTemplate, XcIdentityDataWrapper, XcTemplate } from '@zeta/xc';
import { Observable, Subject } from 'rxjs';

import { ChangeTemplateComponent } from '../shared/change-template.component';
import { RuntimeContextNameComponent } from '../shared/runtime-context-name.component';
import { XoRuntimeContext } from './xo-runtime-context.model';


export const XoDependencyType = {
    EXPLICIT: 'explicit',
    IMPLICIT: 'implicit',
    INDEPENDENT: 'independent'
};


export const XoDependencyTypeEnum = [
    XoDependencyType.EXPLICIT,
    XoDependencyType.IMPLICIT,
    XoDependencyType.INDEPENDENT
];


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'Dependency')
export class XoDependency extends XoObject {

    @XoProperty(XoRuntimeContext)
    @XoUnique()
    runtimeContext: XoRuntimeContext;

    @XoProperty()
    @XoUnique()
    rtcType: string;

    @XoProperty()
    @XoEnumerated(XoDependencyTypeEnum)
    dependencyType: string;

    @XoProperty()
    @XoTransient()
    dependencyTypeInitial: string;

    @XoProperty()
    hierarchyLevel: number;

    @XoProperty()
    @XoTransient()
    typeTemplates: Array<XcTemplate>;

    @XoProperty()
    @XoTransient()
    nameTemplates: Array<XcTemplate>;

    @XoProperty()
    @XoTransient()
    changeTemplate: Array<XcTemplate>;


    private readonly dependencyTypeSubject = new Subject<XoDependency>();


    get dependencyTypeChange(): Observable<XoDependency> {
        return this.dependencyTypeSubject.asObservable();
    }


    get dependencyTypeModified(): boolean {
        return this.dependencyType !== this.dependencyTypeInitial;
    }


    get indeterminate(): boolean {
        return this.dependencyTypeInitial === XoDependencyType.IMPLICIT;
    }


    updateTemplate() {
        const typeTemplate = this.typeTemplates[0] as XcCheckboxTemplate;
        typeTemplate.color = this.dependencyTypeModified ? 'primary' : 'normal';
        typeTemplate.indeterminate = !this.dependencyTypeModified && this.indeterminate;
        typeTemplate.disabled = this.hierarchyLevel > 0;
    }


    afterDecode() {
        this.dependencyTypeInitial = this.dependencyType;

        // create type template
        this.typeTemplates = [
            new XcCheckboxTemplate(
                new XcIdentityDataWrapper<boolean>(
                    ()      => this.dependencyType === XoDependencyType.EXPLICIT,
                    checked => {
                        if (checked) {
                            this.dependencyType = XoDependencyType.EXPLICIT;
                        } else if (this.indeterminate) {
                            this.dependencyType = this.dependencyTypeInitial;
                        } else {
                            this.dependencyType = XoDependencyType.INDEPENDENT;
                        }
                        this.updateTemplate();
                        this.dependencyTypeSubject.next(this);
                    }
                )
            )
        ];
        this.updateTemplate();

        // create name template
        this.nameTemplates = [
            new XcComponentTemplate(RuntimeContextNameComponent, {name: this.runtimeContext.label, hierarchyLevel: this.hierarchyLevel})
        ];

        // create change template
        this.changeTemplate = [
            new XcComponentTemplate(ChangeTemplateComponent, {dependency: this, XoDependencyType})
        ];
    }
}


@XoArrayClass(XoDependency)
export class XoDependencyArray extends XoArray<XoDependency> {
}
