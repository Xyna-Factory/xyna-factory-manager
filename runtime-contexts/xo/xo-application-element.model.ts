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
import { XoDependencyType } from '@fman/runtime-contexts/xo/xo-dependency.model';
import { XoArray, XoArrayClass, XoEnumerated, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { XcCheckboxTemplate, XcComponentTemplate, XcIdentityDataWrapper, XcTemplate } from '@zeta/xc';
import { Observable, Subject } from 'rxjs';

import { ChangeTemplateComponent } from '../shared/change-template.component';


export const XoApplicationElementDependencyType = {
    EXPLICIT: 'explicit',
    IMPLICIT: 'implicit',
    INDIRECT: 'indirect',
    INDEPENDENT: 'independent'
};


export const XoApplicationElementDependencyTypeEnum = [
    XoApplicationElementDependencyType.EXPLICIT,
    XoApplicationElementDependencyType.IMPLICIT,
    XoApplicationElementDependencyType.INDIRECT,
    XoApplicationElementDependencyType.INDEPENDENT
];


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'ApplicationElement')
export class XoApplicationElement extends XoObject {

    @XoProperty()
    @XoUnique()
    name: string;

    @XoProperty()
    @XoUnique()
    elementType: string;

    @XoProperty()
    @XoUnique()
    originRTC: string;

    @XoProperty()
    @XoEnumerated(XoApplicationElementDependencyTypeEnum)
    dependencyType: string;

    @XoProperty()
    @XoTransient()
    dependencyTypeInitial: string;

    @XoProperty()
    @XoTransient()
    typeTemplates: Array<XcTemplate>;

    @XoProperty()
    @XoTransient()
    changeTemplate: Array<XcTemplate>;

    private readonly dependencyTypeSubject = new Subject<XoApplicationElement>();


    get dependencyTypeChange(): Observable<XoApplicationElement> {
        return this.dependencyTypeSubject.asObservable();
    }


    get dependencyTypeModified(): boolean {
        return this.dependencyType !== this.dependencyTypeInitial;
    }


    get indeterminate(): boolean {
        return this.dependencyTypeInitial === XoApplicationElementDependencyType.IMPLICIT ||
               this.dependencyTypeInitial === XoApplicationElementDependencyType.INDIRECT;
    }


    updateTemplate() {
        const typeTemplate = this.typeTemplates[0] as XcCheckboxTemplate;
        typeTemplate.color = this.dependencyTypeModified ? 'primary' : 'normal';
        typeTemplate.indeterminate = !this.dependencyTypeModified && this.indeterminate;
    }


    afterDecode() {
        this.dependencyTypeInitial = this.dependencyType;

        // create type template
        this.typeTemplates = [
            new XcCheckboxTemplate(
                new XcIdentityDataWrapper<boolean>(
                    ()      => this.dependencyType === XoApplicationElementDependencyType.EXPLICIT,
                    checked => {
                        if (checked) {
                            this.dependencyType = XoApplicationElementDependencyType.EXPLICIT;
                        } else if (this.indeterminate) {
                            this.dependencyType = this.dependencyTypeInitial;
                        } else {
                            this.dependencyType = XoApplicationElementDependencyType.INDEPENDENT;
                        }
                        this.updateTemplate();
                        this.dependencyTypeSubject.next(this);
                    }
                )
            )
        ];
        this.updateTemplate();

        // create change template
        this.changeTemplate = [
            new XcComponentTemplate(ChangeTemplateComponent, {dependency: this, XoDependencyType})
        ];
    }
}


@XoArrayClass(XoApplicationElement)
export class XoApplicationElementArray extends XoArray<XoApplicationElement> {
}
